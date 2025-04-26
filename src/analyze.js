const express = require('express');
const AWS = require('aws-sdk');
const youtubedl = require('yt-dlp-exec');
const fs = require('fs');

const router = express.Router();

// Configuração da AWS
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

  // Define caminho e nome do arquivo temporário
  const timestamp = Date.now();
  const filePath = `/tmp/video-${timestamp}.mp4`;
  const s3Key = `videos/video-${timestamp}.mp4`;

  try {
    console.log(`📥 Baixando vídeo de: ${video_url}`);
    await youtubedl(video_url, { output: filePath });

    const fileContent = fs.readFileSync(filePath);

    console.log(`🚀 Enviando para S3: ${s3Key}`);
    await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileContent
    }).promise();

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
