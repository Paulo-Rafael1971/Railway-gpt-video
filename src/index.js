const express = require('express');
const bodyParser = require('body-parser');
const analyze = require('./analyze');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/api', analyze);

app.get('/', (req, res) => {
  res.send('🚀 GPT Video Processor - Render Version');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
