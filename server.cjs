const express = require('express');
console.log('API KEY:', process.env.VITE_ANTHROPIC_API_KEY?.slice(0, 20));

const app = express();
app.use(express.json());

app.post('/api/analyze', async (req, res) => {
  try {
    console.log('Sending key:', process.env.VITE_ANTHROPIC_API_KEY?.slice(0, 25));
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(8080, () => console.log('Proxy running on port 8080'));
