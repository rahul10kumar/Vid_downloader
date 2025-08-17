const express = require('express');
const youtubedl = require('youtube-dl-exec');
const cors = require('cors');

const app = express();

// Enable CORS for all origins (so your front-end can call this server)
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Endpoint to get video info
app.post('/getVideo', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true
    });

    const formats = info.formats
      .filter(f => f.filesize || f.filesize_approx)
      .map(f => ({
        format_id: f.format_id,
        ext: f.ext,
        quality: f.format_note || f.quality,
        size: f.filesize ? (f.filesize / (1024*1024)).toFixed(2) + ' MB' :
              (f.filesize_approx ? (f.filesize_approx / (1024*1024)).toFixed(2) + ' MB' : 'Unknown')
      }));

    res.json({
      title: info.title,
      author: info.uploader,
      formats
    });
  } catch (err) {
    console.error('Error fetching video info:', err);
    res.status(500).json({ error: 'Could not fetch video info. Possibly restricted or unavailable.' });
  }
});

// Endpoint to download video
app.get('/download', async (req, res) => {
  const { url, format_id } = req.query;
  if (!url) return res.status(400).send('No URL provided');

  res.header('Content-Disposition', 'attachment; filename="video.mp4"');

  youtubedl(url, {
    format: format_id || 'best',
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    youtubeSkipDashManifest: true,
  }).pipe(res).on('error', err => {
    console.error('Download error:', err);
    res.status(500).send('Error downloading video.');
  });
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
