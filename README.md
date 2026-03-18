# YT to MP3 Converter

A fast and beautiful YouTube to MP3 converter web application built with Next.js 14, Tailwind CSS, yt-dlp, and ffmpeg.

## Prerequisites (System mein install karna hoga)

Before running the application, make sure you have the required audio processing binaries installed on your system.

### macOS
```bash
brew install yt-dlp ffmpeg
```

### Ubuntu/Debian
```bash
sudo apt install ffmpeg
pip install yt-dlp
```

### Windows
```bash
winget install yt-dlp
winget install ffmpeg
```

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features Realized
- Dark theme inspired by YouTube
- Center hero section with title and subtitle
- Input field with auto-trim on paste and blur, URL validation, and glowing focus borders
- Modern animated Loading and Converting states
- Full success view with video thumbnail, title, rounded file size, and primary download button
- Proper error handling with descriptive states
- Backend running `yt-dlp` using Node's `child_process.exec` securely and passing it as a Base64 encoded payload to the frontend.
- Strict 5-minutes API timeout and 15-minutes maximum video length check to prevent massive downloads.
- Vercel `/tmp` compatible export path for MP3s.
