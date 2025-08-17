const express = require('express');
const youtubedl = require('youtube-dl-exec');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // needed if you access from another domain

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 10000;

// Endpoint to get video info
app.post('/getVideo', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      youtubeSkipDashManifest: true
    });

    const formats = info.formats
      .filter(f => f.acodec !== 'none' && f.vcodec !== 'none')
      .map(f => ({
        format_id: f.format_id,
        quality: f.format_note || f.height + 'p',
        ext: f.ext,
        filesize: f.filesize ? (f.filesize / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown'
      }));

    res.json({
      title: info.title,
      uploader: info.uploader,
      formats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to download video
app.get('/download', async (req, res) => {
  const { url, format_id } = req.query;
  if (!url || !format_id) return res.status(400).send('Missing URL or format');

  res.header('Content-Disposition', 'attachment; filename="video.mp4"');

  youtubedl(url, {
    format: format_id,
    output: '-'
  }).pipe(res);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
