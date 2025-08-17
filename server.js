const express = require('express');
const youtubedl = require('youtube-dl-exec');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Allow all origins

const PORT = process.env.PORT || 10000;

// Get video info
app.post('/getVideo', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    // Fetch info in JSON format
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      youtubeSkipDashManifest: true,
      referer: 'https://www.youtube.com/'
    });


    if (!info || !info.formats) {
      return res.status(500).json({ error: 'Could not fetch video info' });
    }

    // Map formats to send to frontend
    const formats = info.formats.map(f => ({
      format_id: f.format_id,
      quality: f.format_note || f.format,
      ext: f.ext,
      size: f.filesize ? (f.filesize / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown'
    }));

    res.json({
      title: info.title,
      author: info.uploader || 'Unknown',
      formats
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Download endpoint
app.get('/download', (req, res) => {
  const { url, format } = req.query;
  if (!url || !format) return res.status(400).send('Missing parameters');

  res.header('Content-Disposition', 'attachment; filename="video.mp4"');

  youtubedl(url, {
    format: format
  }).pipe(res);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
