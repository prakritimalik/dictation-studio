import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertTriangle } from 'lucide-react';

// Constants
const MIME_TYPES = [
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/wav'
];

const OPENAI_ENDPOINTS = {
  TRANSCRIPTION: 'https://api.openai.com/v1/audio/transcriptions',
  CHAT: 'https://api.openai.com/v1/chat/completions'
};

const SYSTEM_PROMPT = 'You are a helpful assistant that polishes transcribed speech. Clean up filler words, fix grammar, add proper punctuation, and format text into readable sentences and paragraphs while preserving the original meaning.';

export default function DictationApp() {
  const apiKeyFromEnv = import.meta.env.VITE_OPENAI_API_KEY || '';
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [rawText, setRawText] = useState('');
  const [polishedText, setPolishedText] = useState('');
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState(apiKeyFromEnv);
  const [showApiInput] = useState(!apiKeyFromEnv);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
    } catch {
      setPermissionGranted(false);
    }
  };

  const getSupportedMimeType = () => {
    for (const type of MIME_TYPES) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    throw new Error('No supported audio MIME types found on this browser');
  };

  const setupMediaRecorder = (stream, mimeType) => {
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };
    
    mediaRecorder.onstop = () => {
      processAudio();
    };
    
    return mediaRecorder;
  };
  
  const startRecording = async () => {
    try {
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
      
      const mimeType = getSupportedMimeType();
      const mediaRecorder = setupMediaRecorder(stream, mimeType);
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(`Recording error: ${err.message}`);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };
  
  const processAudio = async () => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await processAudioWithOpenAI(audioBlob);
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Failed to process audio.');
      setIsProcessing(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');
    
    const response = await fetch(OPENAI_ENDPOINTS.TRANSCRIPTION, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.text;
  };

  const polishText = async (rawTranscription) => {
    const response = await fetch(OPENAI_ENDPOINTS.CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Polish this raw transcription: ${rawTranscription}`
          }
        ],
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      throw new Error(`Polishing failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  };
  
  const processAudioWithOpenAI = async (audioBlob) => {
    try {
      if (!apiKey) {
        setError('OpenAI API key is required');
        setIsProcessing(false);
        return;
      }
      
      const rawTranscription = await transcribeAudio(audioBlob);
      setRawText(rawTranscription);
      
      const polishedText = await polishText(rawTranscription);
      setPolishedText(polishedText);
    } catch (err) {
      console.error('Error processing with OpenAI:', err);
      setError(`OpenAI API error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getStatusText = () => {
    if (isRecording) return 'Recording...';
    if (isProcessing) return 'Processing audio...';
    if (!apiKey && showApiInput) return 'Enter your OpenAI API key to start';
    if (permissionGranted) return 'Click the button to start recording';
    return 'Click to request microphone access';
  };

  const getButtonState = () => {
    if (isProcessing) return { icon: Loader2, className: 'animate-spin' };
    if (isRecording) return { icon: Square, className: '' };
    return { icon: Mic, className: '' };
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Header */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
              🎤 Voice Dictation Studio
            </h1>
            <p className="text-xl text-purple-100 font-medium">Transform your voice into polished text with AI magic ✨</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recording Interface */}
          <div className="lg:col-span-1">
            <div className="relative bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-2xl p-6 sticky top-8 border border-purple-200">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400 to-pink-400 rounded-full transform translate-x-4 -translate-y-4 opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full transform -translate-x-2 translate-y-2 opacity-20"></div>
              
              {/* API Key Input */}
              {showApiInput && (
                <div className="mb-6 relative">
                  <label className="block text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    🔑 OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full p-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gradient-to-r from-purple-50 to-pink-50"
                    placeholder="sk-..."
                  />
                  <p className="mt-2 text-xs text-purple-600">
                    🔒 Your API key is used only in your browser and not stored on any server.
                  </p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start shadow-lg">
                  <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-red-500 animate-pulse" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Recording Button */}
              <div className="text-center mb-6">
                <div className="relative">
                  {/* Animated Ring */}
                  <div className={`absolute inset-0 rounded-full ${
                    isRecording ? 'animate-ping bg-red-400 opacity-75' : 'bg-gradient-to-r from-blue-400 to-purple-400 opacity-30 animate-pulse'
                  }`}></div>
                  <button
                    onClick={handleRecordClick}
                    disabled={isProcessing || (!apiKey && showApiInput)}
                    className={`relative flex items-center justify-center p-4 rounded-full text-white font-medium transition-all w-20 h-20 text-lg disabled:opacity-50 shadow-2xl hover:shadow-3xl transform hover:scale-110 ${
                      isRecording 
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 animate-pulse' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                    }`}
                  >
                    {(() => {
                      const { icon: Icon, className } = getButtonState();
                      return <Icon className={`w-8 h-8 ${className} drop-shadow-lg`} />;
                    })()}
                  </button>
                </div>
              </div>

              {/* Status Text */}
              <div className="text-center">
                <p className={`text-lg font-bold ${
                  isRecording ? 'text-red-500 animate-pulse' : isProcessing ? 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent'
                }`}>
                  {getStatusText()}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Text Display */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Raw Transcription */}
              {rawText && (
                <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-2xl overflow-hidden border-2 border-orange-200 transform hover:scale-105 transition-all duration-300">
                  <div className="bg-gradient-to-r from-orange-400 to-red-400 px-6 py-4">
                    <h2 className="text-xl font-bold text-white flex items-center drop-shadow-lg">
                      <div className="w-4 h-4 bg-yellow-300 rounded-full mr-3 animate-pulse"></div>
                      🎤 Raw Transcription
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-800 leading-relaxed text-lg">{rawText}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Polished Text */}
              {polishedText && (
                <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-2xl overflow-hidden border-2 border-blue-200 transform hover:scale-105 transition-all duration-300">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4">
                    <h2 className="text-xl font-bold text-white flex items-center drop-shadow-lg">
                      <div className="w-4 h-4 bg-green-300 rounded-full mr-3 animate-bounce"></div>
                      ✨ Polished Text
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-800 leading-relaxed text-lg font-medium">{polishedText}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}