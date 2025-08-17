const { exec } = require("child_process");
const path = require("path");

const ytDlpPath = path.join(__dirname, "yt-dlp");   // Linux binary
const ffmpegPath = path.join(__dirname, "ffmpeg");  // extracted binary
const outputPath = "/tmp/%(title)s.%(ext)s";        // safer temp folder on Render
const url = "https://www.youtube.com/watch?v=ISHrYQVxXRM";

const command = `"${ytDlpPath}" --cookies cookies.txt -f "bv*+ba/best" --merge-output-format mp4 --ffmpeg-location "${ffmpegPath}" -o "${outputPath}" "${url}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error("❌ Error:", stderr);
    return;
  }
  console.log("📥 Download started...");
  console.log(stdout);
  console.log("✅ Download finished!");
});
