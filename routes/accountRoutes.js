const express = require('express');
const axios = require('axios');
const router = express.Router();
const https = require('https');

router.get('/account/detail', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  const apiKey = req.headers['x-api-key'];

  try {
    const response = await axios.get('https://app.smartitbox.in/api/v1/account/detail', {
      headers: {
        'x-api-key': apiKey,
        Authorization: `Bearer ${token}`,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Disable SSL verification
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error fetching profile data from external API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      res.status(error.response.status).json({ message: error.response.data.message });
    } else {
      res.status(500).json({ message: 'Error fetching profile data' });
    }
  }
});

module.exports = router;
