const express = require('express');
const youtubedl = require('youtube-dl-exec');
const cors = require('cors');

const app = express();
app.use(cors()); // allow cross-origin requests
app.use(express.json());

const PORT = process.env.PORT || 10000;

app.post('/getVideo', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      youtubeSkipDashManifest: true,
      referer: 'https://www.youtube.com/'
    });

    if (!info || !info.formats) {
      return res.status(500).json({ error: 'Could not fetch video info. Possibly restricted video or YouTube blocking access.' });
    }

    const videoFormats = info.formats
      .filter(f => f.acodec !== 'none' && f.vcodec !== 'none')
      .map(f => ({
        itag: f.format_id,
        quality: f.format_note || f.quality,
        container: f.ext,
        size: f.filesize ? (f.filesize / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown'
      }));

    res.json({
      title: info.title,
      author: info.uploader,
      formats: videoFormats
    });

  } catch (err) {
    console.error('Error fetching video info:', err.message);
    res.status(500).json({ error: 'Could not fetch video info. ' + err.message });
  }
});

app.get('/download', (req, res) => {
  const { url, itag } = req.query;
  if (!url || !itag) return res.status(400).send('Missing url or itag');

  try {
    res.header('Content-Disposition', 'attachment; filename="video.mp4"');
    youtubedl(url, {
      format: itag,
      noWarnings: true,
      noCheckCertificates: true
    }).pipe(res);
  } catch (err) {
    res.status(500).send('Download failed: ' + err.message);
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
