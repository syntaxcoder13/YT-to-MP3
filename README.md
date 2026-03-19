# YT to MP3 Converter

A fast and beautiful YouTube to MP3 converter web application built with Next.js 14, Tailwind CSS, and RapidAPI.

## Prerequisites (RapidAPI Setup)

Before running the application, make sure you have your RapidAPI credentials ready.

1.  Subscribe to [YouTube to MP3 API](https://rapidapi.com/n0p97u/api/youtube-mp36) on RapidAPI Hub.
2.  Create a `.env.local` file in the root directory.
3.  Add your API key and host:
```bash
RAPIDAPI_KEY=your_key_here
RAPIDAPI_HOST=youtube-mp36.p.rapidapi.com
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
- Backend running RapidAPI conversion for high reliability and speed.
- Small footprint with no local binary dependencies.
