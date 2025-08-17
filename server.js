const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Endpoint to get YouTube video info (player page)
app.post('/getVideo', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' });

    // Fetch YouTube watch page
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();

    // Extract player response JSON from HTML
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
    if (!match) return res.status(500).json({ error: 'Could not parse video info' });

    const playerResponse = JSON.parse(match[1]);
    const videoDetails = playerResponse.videoDetails;
    const streamingData = playerResponse.streamingData;

    if (!streamingData) return res.status(500).json({ error: 'Streaming data not found' });

    const formats = streamingData.formats?.map(f => ({
      itag: f.itag,
      quality: f.qualityLabel || f.quality,
      mimeType: f.mimeType,
      url: f.url
    })) || [];

    res.json({
      title: videoDetails.title,
      author: videoDetails.author,
      formats
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

// Stream video via proxy
app.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('No URL provided');

  try {
    const response = await fetch(url);
    res.setHeader('Content-Type', response.headers.get('content-type'));
    response.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to stream video');
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
