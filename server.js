// server.js
const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API: Download video
app.get("/download", (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Generate a temp file path
  const outputTemplate = path.join(__dirname, "downloads", "%(title)s.%(ext)s");
  if (!fs.existsSync(path.join(__dirname, "downloads"))) {
    fs.mkdirSync(path.join(__dirname, "downloads"));
  }

  console.log(`📥 Downloading: ${videoUrl}`);

  // Spawn yt-dlp
  const ytdlp = spawn("yt-dlp", [
    "-f",
    "bv*+ba/best",
    "--merge-output-format",
    "mp4",
    "-o",
    outputTemplate,
    videoUrl,
  ]);

  let stderr = "";
  ytdlp.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  ytdlp.on("close", (code) => {
    if (code !== 0) {
      console.error("❌ yt-dlp error:", stderr);
      return res.status(500).json({ error: "Download failed" });
    }

    // Find the downloaded file
    fs.readdir(path.join(__dirname, "downloads"), (err, files) => {
      if (err || files.length === 0) {
        return res.status(500).json({ error: "File not found" });
      }

      const latestFile = path.join(__dirname, "downloads", files[0]);
      console.log("✅ Download finished:", latestFile);

      // Send file to client
      res.download(latestFile, (err) => {
        if (err) console.error("Download error:", err);
        // Clean up after sending
        fs.unlinkSync(latestFile);
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
