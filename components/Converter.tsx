"use client";

import { useState, useEffect } from "react";
import { Loader2, Download, AlertCircle, RefreshCw, Music } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "converting" | "success" | "error";

interface ResultData {
  title: string;
  thumbnail: string;
  fileSize: string;
  audioData: string; // base64
}

export default function Converter() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);

  const [isValidUrl, setIsValidUrl] = useState(true);

  // Auto-trim inside the input change handler makes it seamless,
  // but let's also trim on paste or blur. The actual requirement:
  // "URL input mein paste karte hi auto-trim ho"
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    
    // Validate Realtime
    if (val.trim() === "") {
      setIsValidUrl(true);
    } else {
      const isYt = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(val.trim());
      setIsValidUrl(isYt);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").trim();
    setUrl(pastedText);
    const isYt = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(pastedText);
    setIsValidUrl(isYt);
  };

  const handleConvert = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    if (!/^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(trimmedUrl)) {
      setIsValidUrl(false);
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    setResult(null);

    try {
      // Simulate switching to "converting" status after we get info (or after small delay)
      // Usually, backend API handles everything, but to show "converting" state,
      // we can do it via a streaming response or simply transition after 2s for UI purposes.
      const timer = setTimeout(() => setStatus("converting"), 2500);

      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      clearTimeout(timer);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to convert video");
      }

      setResult(data);
      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
      setStatus("error");
    }
  };

  const handleDownload = () => {
    if (!result?.audioData) return;
    
    // Process base64 back into binary and download
    const byteCharacters = atob(result.audioData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/mpeg' });
    const blobUrl = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = blobUrl;
    // Replace strict illegal characters in title to be safe
    const safeTitle = result.title.replace(/[<>:"/\\|?*]+/g, '_');
    a.download = `${safeTitle}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  const resetState = () => {
    setUrl("");
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    setIsValidUrl(true);
  };

  return (
    <div className="w-full bg-[#181818]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl transition-all">
      <div className="space-y-6">
        <div className="space-y-2 relative">
          <input
            type="text"
            placeholder="Paste YouTube URL here..."
            value={url}
            onChange={handleUrlChange}
            onPaste={handlePaste}
            disabled={status === "loading" || status === "converting"}
            className={cn(
              "w-full bg-[#0f0f0f] border rounded-xl px-5 py-4 text-white placeholder:text-zinc-500",
              "focus:outline-none focus:ring-4 transition-all duration-300",
              !isValidUrl && url.length > 0
                ? "border-red-500 focus:ring-red-500/20"
                : "border-white/10 focus:border-red-500 focus:ring-red-500/20",
              (status === "loading" || status === "converting") && "opacity-60 cursor-not-allowed"
            )}
          />
          {!isValidUrl && url.length > 0 && (
            <p className="text-red-400 text-sm flex items-center gap-1 mt-2">
              <AlertCircle size={14} /> Please enter a valid YouTube URL
            </p>
          )}
        </div>

        <button
          onClick={handleConvert}
          disabled={!url.trim() || !isValidUrl || status === "loading" || status === "converting" || status === "success"}
          className="w-full relative flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {status === "loading" || status === "converting" ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Converting...
            </span>
          ) : (
            "Convert Now"
          )}
        </button>
      </div>

      <div className="mt-8">

      {(status === "loading" || status === "converting") && (
        <div className="py-6 flex flex-col items-center justify-center space-y-6 border-t border-white/5 pt-8 animate-in fade-in zoom-in-95">
          {status === "loading" ? (
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl bg-red-500/30 animate-pulse" />
              <Loader2 className="w-12 h-12 text-red-500 animate-spin relative z-10" />
            </div>
          ) : (
            <div className="w-full max-w-md space-y-3">
              <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-red-500 w-full animate-[progress_2s_ease-in-out_infinite]" style={{
                  transformOrigin: "left",
                  animation: "indeterminate-progress 1.5s infinite linear"
                }}></div>
              </div>
            </div>
          )}
          <p className="text-base font-medium text-zinc-300 animate-pulse">
            {status === "loading" ? "Fetching video info..." : "Converting to MP3..."}
          </p>
          
           <style jsx>{`
            @keyframes indeterminate-progress {
              0% { transform: translateX(-100%) scaleX(0.2); }
              50% { transform: translateX(0) scaleX(0.5); }
              100% { transform: translateX(100%) scaleX(0.2); }
            }
          `}</style>
        </div>
      )}

      {status === "success" && result && (
        <div className="space-y-6 border-t border-white/5 pt-8 animate-in zoom-in-95 duration-500">
          <div className="flex flex-col md:flex-row gap-6 items-center bg-[#0f0f0f] rounded-2xl p-4 border border-white/5">
            <img
              src={result.thumbnail}
              alt={result.title}
              className="w-full md:w-48 aspect-video object-cover rounded-xl shadow-lg"
            />
            <div className="flex-1 space-y-3 text-center md:text-left">
              <h3 className="text-xl font-bold text-white line-clamp-2 md:line-clamp-3">
                {result.title}
              </h3>
              <div className="flex items-center justify-center md:justify-start gap-3 text-zinc-400 font-medium">
                <span className="flex items-center gap-1 bg-zinc-800/50 px-3 py-1 rounded-full text-sm">
                  <Music size={14} /> MP3
                </span>
                <span className="bg-zinc-800/50 px-3 py-1 rounded-full text-sm">
                  {result.fileSize}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownload}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download size={20} /> Download MP3
            </button>
            <button
              onClick={resetState}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Convert Another
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="py-6 space-y-6 text-center border-t border-white/5 pt-8 animate-in zoom-in-95 duration-300">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-2">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Conversion Failed</h3>
            <p className="text-red-400 bg-red-500/10 p-4 rounded-xl max-w-md mx-auto text-sm border border-red-500/20">
              {errorMsg}
            </p>
          </div>
          <button
             onClick={() => setStatus("idle")}
             className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-xl transition-colors font-medium text-sm"
          >
            Try Again
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
