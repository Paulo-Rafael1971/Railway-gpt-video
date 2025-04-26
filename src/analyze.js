const express = require('express');
const AWS = require('aws-sdk');
const youtubedl = require('yt-dlp-exec');
const fs = require('fs');

const router = express.Router();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

router.post('/analyze', async (req, res) => {
  const { video_url } = req.body;

  if (!video_url) {
    return res.status(400).json({ error: 'URL do vídeo é obrigatória!' });
  }

  const filePath = '/tmp/video.mp4';

  try {
    await youtubedl(video_url, { output: filePath });
    const fileContent = fs.readFileSync(filePath);

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: 'videos/video.mp4',
      Body: fileContent
    };

    await s3.upload(params).promise();
    const url = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: 'videos/video.mp4',
      Expires: 3600
    });

    res.status(200).json({ url });
  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ error: 'Falha ao processar o vídeo' });
  }
});

module.exports = router;