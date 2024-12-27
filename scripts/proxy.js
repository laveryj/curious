const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

// Use environment variable for the PAT
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

app.post('/trigger', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.github.com/repos/laveryj/curious/dispatches',
      {
        event_type: 'force-update',
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.everest-preview+json',
        },
      }
    );

    res.status(200).send('Update triggered successfully');
  } catch (error) {
    console.error('Error triggering workflow:', error.message);
    res.status(500).send('Error triggering workflow');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});