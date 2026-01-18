const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const HOST = '0.0.0.0';

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/manifest', (req, res) => {
  try {
    const manifest = JSON.parse(fs.readFileSync('module.manifest.json', 'utf8'));
    res.json(manifest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load manifest' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`WebWaka Suite POS running at http://${HOST}:${PORT}`);
});
