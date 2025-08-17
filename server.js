const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors()); // allow all origins; for production, restrict to your domain
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Endpoint to get YouTube video info (player page)
app.post('/getVideo', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    // Extract video ID
    const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (!videoIdMatch) return res.status(400).json({ error: 'Invalid YouTube URL' });

    const videoId = videoIdMatch[1];

    // Fetch YouTube watch page
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    if (!response.ok) return res.status(500).json({ error: 'Failed to fetch YouTube page' });

    const html = await response.text();

    // Extract player response JSON
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
    if (!match) return res.status(500).json({ error: 'Could not parse video info' });

    const playerResponse = JSON.parse(match[1]);
    const videoDetails = playerResponse.videoDetails;
    const streamingData = playerResponse.streamingData;

    if (!streamingData) return res.status(500).json({ error: 'Streaming data not found' });

    const formats = [
      ...(streamingData.formats || []),
      ...(streamingData.adaptiveFormats || [])
    ].map(f => ({
      itag: f.itag,
      quality: f.qualityLabel || f.quality,
      mimeType: f.mimeType,
      url: f.url || null
    })).filter(f => f.url); // remove any formats without direct URL

    res.json({
      title: videoDetails.title,
      author: videoDetails.author,
      formats
    });

  } catch (err) {
    console.error('Error in /getVideo:', err);
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

// Stream video via proxy
app.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('No URL provided');

  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(500).send('Failed to fetch video stream');

    // Set headers to allow browser to download/play
    res.setHeader('Content-Type', response.headers.get('content-type'));
    res.setHeader('Content-Length', response.headers.get('content-length'));

    // Pipe the stream to client
    response.body.pipe(res);

  } catch (err) {
    console.error('Error in /stream:', err);
    res.status(500).send('Failed to stream video');
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
