import Converter from "@/components/Converter";

export default function Home() {
  return (
    <div className="w-full max-w-3xl flex flex-col items-center mt-10 space-y-10 w-full">
      <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
          YT to MP3 <span className="animate-pulse">🎵</span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 font-medium max-w-xl mx-auto">
          YouTube videos ko MP3 mein convert karo — free & fast
        </p>
      </div>

      <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
        <Converter />
      </div>
    </div>
  );
}
