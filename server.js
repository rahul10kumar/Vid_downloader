const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Get video info
app.post('/getVideo', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  // Run yt-dlp to get JSON info
  const command = `yt-dlp -j "${url}" --no-check-certificate --no-warnings --youtube-skip-dash-manifest`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error('yt-dlp error:', stderr || err.message);
      return res.status(500).json({ error: 'Could not fetch video info' });
    }

    try {
      const info = JSON.parse(stdout);
      const formats = info.formats
        .filter(f => f.filesize || f.filesize_approx)
        .map(f => ({
          itag: f.format_id,
          ext: f.ext,
          quality: f.format_note || f.quality,
          size: f.filesize ? (f.filesize / (1024*1024)).toFixed(2)+' MB' : (f.filesize_approx ? (f.filesize_approx / (1024*1024)).toFixed(2)+' MB' : 'Unknown')
        }));

      res.json({
        title: info.title,
        author: info.uploader,
        formats
      });
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr.message);
      res.status(500).json({ error: 'Failed to parse video info' });
    }
  });
});

// Stream video
app.get('/download', (req, res) => {
  const { url, itag } = req.query;
  if (!url) return res.status(400).send('No URL provided');

  res.header('Content-Disposition', 'attachment; filename="video.mp4"');

  const command = `yt-dlp -f ${itag || 'best'} -o - "${url}" --no-check-certificate --no-warnings`;
  const child = exec(command, { maxBuffer: 1024 * 1024 * 1024 }); // 1GB buffer
  child.stdout.pipe(res);
  child.stderr.on('data', d => console.error(d.toString()));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
