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

  const filePath = `/tmp/video-${Date.now()}.mp4`;

  try {
    console.log(`📥 Baixando vídeo de: ${video_url}`);
    await youtubedl(video_url, { output: filePath });

    const fileContent = fs.readFileSync(filePath);

    const s3Key = `videos/video-${Date.now()}.mp4`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileContent
    };

    console.log(`🚀 Enviando para S3: ${s3Key}`);
    await s3.upload(params).promise();

    const url = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Expires: 3600
    });

    // Limpeza do arquivo local
    fs.unlinkSync(filePath);
    console.log('🧹 Arquivo temporário removido!');

    res.status(200).json({ url });

  } catch (err) {
    console.error('❌ Erro:', err);
    res.status(500).json({ error: 'Falha ao processar o vídeo', detalhe: err.message });
  }
});

module.exports = router;
