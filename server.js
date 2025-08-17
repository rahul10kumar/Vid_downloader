const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors'); // <-- import cors

const app = express();
app.use(express.json());
app.use(cors()); // <-- allow all origins
app.use(express.static('public'));

const PORT = process.env.PORT || 10000;

// ... rest of your code


// Endpoint to get video info
app.post('/getVideo', async (req, res) => {
  const { url } = req.body;
  if (!ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'audioandvideo');

    const videoFormats = formats.map(f => ({
      itag: f.itag,
      quality: f.qualityLabel,
      container: f.container,
      size: f.contentLength ? (f.contentLength / (1024*1024)).toFixed(2)+' MB' : 'Unknown',
    }));

    res.json({
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      formats: videoFormats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to download video
app.get('/download', async (req, res) => {
  const { url, itag } = req.query;
  if (!ytdl.validateURL(url)) return res.status(400).send('Invalid URL');

  res.header('Content-Disposition', 'attachment; filename="video.mp4"');
  ytdl(url, { quality: itag }).pipe(res);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
