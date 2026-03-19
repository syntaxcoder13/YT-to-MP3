import { NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "youtube-mp36.p.rapidapi.com";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export const maxDuration = 300; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Extract Video ID
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    const videoId = videoIdMatch?.[1];

    if (!videoId) {
      return NextResponse.json({ error: "Could not extract Video ID from URL." }, { status: 400 });
    }

    if (!RAPIDAPI_KEY) {
      return NextResponse.json({ error: "RapidAPI Key is missing. Please set RAPIDAPI_KEY in your env." }, { status: 500 });
    }

    // 1. Initiate Download Request via RapidAPI
    // Let's use youtube-mp36 as it's the most common
    const apiUrl = `https://${RAPIDAPI_HOST}/dl?id=${videoId}`;
    
    let result;
    try {
      const apiRes = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
        },
      });

      result = await apiRes.json();
    } catch (err: any) {
      console.error("RapidAPI fetch error:", err);
      return NextResponse.json({ error: "Failed to connect to RapidAPI." }, { status: 500 });
    }

    if (result.status === "fail") {
      return NextResponse.json({ error: result.msg || "API request failed." }, { status: 400 });
    }

    // Status could be "processing" or "ok"
    // Usually youtube-mp36 is fast, but just in case we error if not ok
    if (result.status !== "ok") {
       return NextResponse.json({ error: result.msg || "The video is being processed. Try again in a few seconds." }, { status: 400 });
    }

    const { link, title, filesize } = result;

    if (!link) {
      return NextResponse.json({ error: "Download link not found in API response." }, { status: 500 });
    }

    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // 2. Fetch the audio file from the provided link to convert to base64
    // This maintains compatibility with the existing frontend
    let audioData = "";
    try {
      const audioRes = await fetch(link);
      const audioBuffer = await audioRes.arrayBuffer();
      audioData = Buffer.from(audioBuffer).toString("base64");
    } catch (err: any) {
      console.error("Audio download error:", err);
      return NextResponse.json({ error: "Failed to fetch conversion from RapidAPI link." }, { status: 500 });
    }

    return NextResponse.json({
      title: title || "Downloaded Audio",
      thumbnail,
      fileSize: formatBytes(filesize || 0),
      audioData
    });

  } catch (error: any) {
    console.error("General error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
