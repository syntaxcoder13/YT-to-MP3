import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import util from "util";

const execAsync = util.promisify(exec);

function parseDuration(durationStr: string): number {
  const parts = durationStr.trim().split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]; // MM:SS
  }
  return parts[0] || 0; // SS
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export const maxDuration = 300; // Next.js 14 API Route timeout

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    const isValid = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(url);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // Wrap URL in quotes safely (simple prevention of basic injections, but yt-dlp expects valid YouTube URLs)
    const safeUrl = url.replace(/"/g, '\\"');

    // 1. Check Duration (max 15 minutes)
    try {
      const { stdout: durationOut } = await execAsync(`yt-dlp --get-duration "${safeUrl}"`);
      const durationSec = parseDuration(durationOut);
      if (durationSec > 15 * 60) {
        return NextResponse.json({ error: "Video exceeds 15 minutes limit" }, { status: 400 });
      }
    } catch (err: any) {
      console.error("Duration fetch error:", err);
      const errMsg = err?.message || "";
      if (errMsg.includes("not recognized") || errMsg.includes("not found")) {
        return NextResponse.json({ error: "System Error: yt-dlp is not installed or not in PATH. Please install yt-dlp and ffmpeg first." }, { status: 500 });
      }
      return NextResponse.json({ error: "Could not fetch video duration or invalid video." }, { status: 400 });
    }

    // 2. Setup tmp dir
    // We use os.tmpdir() to be exactly mapped correctly on Windows/macOS/Vercel (which defaults to /tmp)
    const tmpDir = os.tmpdir();
    const outputTemplate = path.join(tmpDir, "%(title)s.%(ext)s");

    // 3. Execute yt-dlp command
    const cmd = `yt-dlp -x --audio-format mp3 --audio-quality 0 --output "${outputTemplate.replace(/\\/g, "/")}" --print-json --no-playlist "${safeUrl}"`;

    let stdoutJSON = "";
    try {
      // 5 minutes timeout = 300000ms
      const { stdout } = await execAsync(cmd, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 });
      stdoutJSON = stdout;
    } catch (err: any) {
      console.error("Download error:", err);
      return NextResponse.json({ error: "Failed to download and convert video." }, { status: 500 });
    }

    let videoInfo;
    try {
      // Parse the last line of stdout which contains the JSON (in case yt-dlp prints warnings before)
      const lines = stdoutJSON.trim().split("\n");
      const jsonLine = lines[lines.length - 1];
      videoInfo = JSON.parse(jsonLine);
    } catch (e) {
      console.error("JSON parse error:", e);
      return NextResponse.json({ error: "Failed to parse video info." }, { status: 500 });
    }

    const title = videoInfo.title || "audio";
    const thumbnail = videoInfo.thumbnail || "";
    const downloadedFilePath = videoInfo._filename;

    if (!downloadedFilePath) {
      return NextResponse.json({ error: "Could not locate downloaded file path." }, { status: 500 });
    }

    // The downloaded file might have .webm or .m4a in _filename, but --audio-format mp3 
    // forces it to rewrite as .mp3. So we change the extension of _filename to .mp3.
    const fileBase = downloadedFilePath.substring(0, downloadedFilePath.lastIndexOf("."));
    const finalMp3Path = `${fileBase}.mp3`;

    if (!fs.existsSync(finalMp3Path)) {
      return NextResponse.json({ error: "MP3 file not found after conversion." }, { status: 500 });
    }

    // 4. Read MP3 and convert to base64
    const fileBuffer = fs.readFileSync(finalMp3Path);
    const audioData = fileBuffer.toString("base64");
    
    const stats = fs.statSync(finalMp3Path);
    const fileSizeHuman = formatBytes(stats.size);

    // 5. Cleanup
    try {
      fs.unlinkSync(finalMp3Path);
      // Also attempt to delete the original non-audio file if it was left behind, usually it isn't with -x
    } catch (e) {
      console.error("Cleanup error:", e);
    }

    // 6. Return response
    return NextResponse.json({
      title,
      thumbnail,
      fileSize: fileSizeHuman,
      audioData
    });

  } catch (error: any) {
    console.error("General error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
