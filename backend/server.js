import express from 'express';
import multer from 'multer';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import FormData from 'form-data';

dotenv.config();
const app = express();
const upload = multer({ dest: 'uploads/' });
// Configure CORS for production
const corsOptions = {
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Alternative dev server
    'https://whisper.pmalik.xyz', // Production domain
    'https://deploy-preview-*.netlify.app', // Netlify preview deployments
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log("Using API Key:", OPENAI_API_KEY?.slice(0, 10) + '...');
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    console.log('formdata', formData)

    console.log('Uploaded file path:', req.file.path);
console.log('Uploaded file mimetype:', req.file.mimetype);
console.log('Uploaded file size (bytes):', req.file.size);
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const data = await response.json();
    fs.unlinkSync(req.file.path); // clean up file
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

app.post('/api/polish', async (req, res) => {
  try {
    const { text } = req.body;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Improve the transcribed speech by fixing grammar, punctuation, and clarity, keeping the text in English.'
          },
          {
            role: 'user',
            content: `Polish this: ${text}`
          }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Polishing failed' });
  }
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '🎤 Voice Dictation Studio API', 
    version: '1.0.0',
    endpoints: ['/api/transcribe', '/api/polish']
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
