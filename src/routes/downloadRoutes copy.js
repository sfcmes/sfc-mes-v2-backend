const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const fileUrl = req.query.url;
    if (!fileUrl) {
      return res.status(400).json({ message: 'File URL is required' });
    }

    const response = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'stream'
    });

    // Set the appropriate headers
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Content-Disposition', `attachment; filename="${response.headers['content-disposition']}"`);

    // Pipe the file stream to the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Error downloading file', details: error.message });
  }
});

module.exports = router;