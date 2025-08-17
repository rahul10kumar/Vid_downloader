const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Paths to binaries
const ytDlpPath = path.join(__dirname, "yt-dlp");
const ffmpegPath = path.join(__dirname, "ffmpeg");

// Output folder
const downloadDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

// URL to download
const url = "https://www.youtube.com/watch?v=zrtQb4IIY6Y";
const outputPath = path.join(downloadDir, "%(title)s.%(ext)s");

// yt-dlp command
const command = `"${ytDlpPath}" -f "bv*+ba/best" --merge-output-format mp4 --ffmpeg-location "${ffmpegPath}" -o "${outputPath}" "${url}"`;

console.log("📥 Downloading:", url);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error("❌ Error:", stderr);
    return;
  }
  console.log(stdout);
  console.log("✅ Download finished! Check downloads folder.");
});

// Start Express server (optional, if you want a frontend)
const express = require("express");
const app = express();
const PORT = process.env.PORT || 10000;

app.use("/downloads", express.static(downloadDir));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
