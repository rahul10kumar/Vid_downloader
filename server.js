const express = require('express');
const youtubedl = require('youtube-dl-exec');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Get basic video info
app.post('/getVideo', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
      verbose: true,   // <-- add this
    });
    console.log(info);

    res.json({
      title: info.title,
      author: info.uploader,
      formats: [
        { label: 'Best', format: 'best' },
        { label: 'MP4', format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]' }
      ]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch video info. Possibly restricted or unavailable.' });
  }
});

// Stream video
app.get('/download', async (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.status(400).send('No URL provided');

  try {
    res.header('Content-Disposition', 'attachment; filename="video.mp4"');

    const video = youtubedl(url, {
      format: format || 'best',
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true
    });

    video.stdout.pipe(res);

    video.stderr.on('data', data => console.error(`stderr: ${data}`));
    video.on('error', err => {
      console.error(err);
      res.status(500).send('Error streaming video.');
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error streaming video.');
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
