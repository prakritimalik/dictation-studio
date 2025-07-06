# 🎤 Voice Dictation Studio

Transform your voice into polished text with AI magic ✨

## 🚀 Features

- **🎵 Real-time voice recording** with modern web APIs
- **🤖 AI-powered transcription** using OpenAI Whisper
- **✨ Text polishing** with GPT for perfect grammar and formatting
- **🎨 Beautiful, colorful UI** with animations and gradients
- **📱 Responsive design** that works on all devices
- **🔒 Privacy-focused** - API keys stay in your browser

## 🏗️ Project Structure

```
dictation-studio/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── Dictation.jsx
│   │   └── ...
│   └── package.json
├── backend/           # Node.js Express backend
│   ├── server.js
│   └── package.json
└── README.md
```

## 🛠️ Setup & Installation

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
# Add your OpenAI API key to .env file
echo "OPENAI_API_KEY=your-api-key-here" > .env
npm start
```

## 🎨 Tech Stack

**Frontend:**
- React 19
- Tailwind CSS 3
- Vite
- Lucide React Icons

**Backend:**
- Node.js
- Express
- OpenAI API
- Multer (file uploads)

## 🔐 Environment Variables

Create a `.env` file in the backend folder:
```
OPENAI_API_KEY=your-openai-api-key-here
```

## 🚀 Usage

1. Start the backend server
2. Start the frontend development server
3. Open your browser and grant microphone permissions
4. Click the colorful record button to start dictating
5. Watch as your speech is transcribed and polished in real-time!

## 🎯 Future Features

- Copy to clipboard functionality
- Export to various formats (PDF, DOCX)
- Recording history
- Multiple language support
- Custom AI prompts

---

**Built with ❤️ using React, Node.js, and OpenAI**