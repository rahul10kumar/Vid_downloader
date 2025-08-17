const express = require('express');
const fetch = require('node-fetch'); // use node 18+ built-in fetch if available
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Example endpoint
app.post('/getVideo', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    // Here, you would normally call yt-dlp or a third-party API to get the real download URL
    // Example: Using RapidAPI just to get the direct link
    const apiRes = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${encodeURIComponent(url)}`, {
      headers: {
        'X-RapidAPI-Key': 'YOUR_API_KEY',
        'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
      }
    });

    const data = await apiRes.json();
    if (!data.link) return res.status(500).json({ error: 'Could not get download link' });

    res.json({
      title: data.title,
      link: data.link
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
