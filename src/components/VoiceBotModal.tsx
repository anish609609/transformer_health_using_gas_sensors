// src/components/VoiceBotModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Send,
  X,
  Key,
  Languages,
  User,
  Bot,
  ExternalLink,
  AlertTriangle,
  Square
} from 'lucide-react';
import {
  SarvamLanguageCode,
  SARVAM_LANGUAGES,
  SARVAM_SPEAKERS,
  getSarvamApiKey,
  getSavedLanguage,
  setSavedLanguage,
  getSavedSpeaker,
  setSavedSpeaker,
  synthesizeSpeech,
  transcribeAudio,
  generateCasualResponse,
  LiveTransformerContext,
} from '../services/sarvamService';
import { SarvamKeyModal } from './SarvamKeyModal';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  audioUrl?: string;
  language: SarvamLanguageCode;
  isPlaying?: boolean;
}

interface VoiceBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  transformerContext: LiveTransformerContext;
  onSelectScenario?: (key: string) => void;
}

export const VoiceBotModal: React.FC<VoiceBotModalProps> = ({
  isOpen,
  onClose,
  transformerContext,
}) => {
  const [apiKey, setApiKey] = useState<string>(() => getSarvamApiKey());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SarvamLanguageCode>(() => getSavedLanguage());
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>(() => getSavedSpeaker());

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  // Audio elements
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync key if changed in localStorage
  useEffect(() => {
    const handleStorage = () => setApiKey(getSarvamApiKey());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Initialize greeting on first open or language switch
  useEffect(() => {
    if (!isOpen) return;

    const currentKey = getSarvamApiKey();
    setApiKey(currentKey);

    // Initial greeting in selected language with casual tone
    if (messages.length === 0) {
      let greeting = '';
      if (selectedLanguage === 'hi-IN') {
        greeting = `नमस्ते भाई! मैं आपका सबस्टेशन वॉयस असिस्टेंट हूँ (Sarvam AI पावर्ड)। ट्रांसफॉर्मर की गैस रीडिंग, फॉल्ट अलार्म या अगला एक्शन—मुझसे बिंदास पूछिए!`;
      } else if (selectedLanguage === 'ta-IN') {
        greeting = `வணக்கம் பாஸ்! நான் உங்க சப்ஸ்டேஷன் வாய்ஸ் ட்வின் (Sarvam AI). டிரான்ஸ்பார்மர் கேஸ் அளவு, பால்ட் வார்னிங் அல்லது என்ன செய்யணும்னு என்கிட்ட கேளுங்க!`;
      } else {
        greeting = `Hey there! I'm your Substation Voice Twin powered by Sarvam AI. Ask me anything about current gas levels, fault status, or what action we should take!`;
      }

      const initialMsg: Message = {
        id: 'initial-greeting',
        sender: 'bot',
        text: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLanguage,
      };

      setMessages([initialMsg]);

      // If user has key, synthesize initial greeting audio automatically
      if (currentKey) {
        synthesizeSpeech({
          text: greeting,
          languageCode: selectedLanguage,
          speaker: selectedSpeaker,
          apiKey: currentKey,
        })
          .then((res) => {
            initialMsg.audioUrl = res.audioUrl;
            setMessages([initialMsg]);
          })
          .catch((err) => console.warn('Sarvam greeting audio synthesis error:', err));
      }
    }
  }, [isOpen, selectedLanguage]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Handle Stop Audio
  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setCurrentlyPlayingId(null);
  };

  // Play audio for a message
  const playAudio = async (msg: Message) => {
    stopCurrentAudio();

    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }

    try {
      let url = msg.audioUrl;
      if (!url) {
        // Synthesize on demand
        setIsProcessing(true);
        const res = await synthesizeSpeech({
          text: msg.text,
          languageCode: msg.language,
          speaker: selectedSpeaker,
          apiKey,
        });
        url = res.audioUrl;
        msg.audioUrl = url;
        setIsProcessing(false);
      }

      const audio = new Audio(url);
      currentAudioRef.current = audio;
      setCurrentlyPlayingId(msg.id);

      audio.onended = () => {
        setCurrentlyPlayingId(null);
      };
      audio.onerror = () => {
        setCurrentlyPlayingId(null);
      };

      await audio.play();
    } catch (err: any) {
      console.error('Playback error:', err);
      setIsProcessing(false);
      setCurrentlyPlayingId(null);
    }
  };

  // Switch Language
  const handleLanguageChange = (lang: SarvamLanguageCode) => {
    setSelectedLanguage(lang);
    setSavedLanguage(lang);
    stopCurrentAudio();

    // Trigger quick friendly confirmation in new language
    let confirmText = '';
    if (lang === 'hi-IN') {
      confirmText = `भाषा हिंदी कर दी गई है। बोलिए, ट्रांसफॉर्मर का हालचाल जानना है?`;
    } else if (lang === 'ta-IN') {
      confirmText = `மொழி தமிழுக்கு மாற்றப்பட்டது பாஸ். என்ன சந்தேகம்னாலும் கேளுங்க!`;
    } else {
      confirmText = `Switched to Indian English! What would you like to check on the transformer?`;
    }

    const botMsg: Message = {
      id: `lang-change-${Date.now()}`,
      sender: 'bot',
      text: confirmText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: lang,
    };

    setMessages((prev) => [...prev, botMsg]);

    if (apiKey) {
      synthesizeSpeech({
        text: confirmText,
        languageCode: lang,
        speaker: selectedSpeaker,
        apiKey,
      })
        .then((res) => {
          botMsg.audioUrl = res.audioUrl;
          playAudio(botMsg);
        })
        .catch(() => {});
    }
  };

  // Switch Speaker
  const handleSpeakerChange = (speaker: string) => {
    setSelectedSpeaker(speaker);
    setSavedSpeaker(speaker);
  };

  // Submit Text Query
  const handleSendMessage = async (textQuery?: string) => {
    const query = (textQuery || inputText).trim();
    if (!query) return;

    setInputText('');
    stopCurrentAudio();

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: selectedLanguage,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      // 1. Generate Casual Tone Response using live substation context
      const replyText = await generateCasualResponse(
        query,
        transformerContext,
        selectedLanguage,
        apiKey
      );

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: selectedLanguage,
      };

      // 2. Synthesize Voice with Sarvam TTS if key exists
      if (apiKey) {
        try {
          const ttsRes = await synthesizeSpeech({
            text: replyText,
            languageCode: selectedLanguage,
            speaker: selectedSpeaker,
            apiKey,
          });
          botMsg.audioUrl = ttsRes.audioUrl;
        } catch (ttsErr) {
          console.warn('Sarvam TTS error, showing text only:', ttsErr);
        }
      }

      setMessages((prev) => [...prev, botMsg]);
      setIsProcessing(false);

      // Automatically play audio response
      if (botMsg.audioUrl) {
        playAudio(botMsg);
      }
    } catch (err: any) {
      console.error('Error generating voice response:', err);
      setIsProcessing(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: `Oops! Had a slight hiccup connecting to Sarvam AI: ${err.message || 'Unknown issue'}. Please check your token.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: selectedLanguage,
        },
      ]);
    }
  };

  // --- Voice Recording Logic (MediaRecorder -> Sarvam STT) ---
  const startRecording = async () => {
    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }

    try {
      stopCurrentAudio();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        setIsProcessing(true);
        try {
          // Transcribe via Sarvam AI Saaras
          const sttRes = await transcribeAudio({
            audioBlob,
            apiKey,
            languageCode: selectedLanguage,
            prompt: 'Transformer DGA gas analysis substation diagnosis',
          });

          if (sttRes.transcript && sttRes.transcript.trim()) {
            handleSendMessage(sttRes.transcript.trim());
          } else {
            setIsProcessing(false);
          }
        } catch (sttErr: any) {
          console.error('Sarvam STT failed:', sttErr);
          setIsProcessing(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              sender: 'bot',
              text: `Could not transcribe your voice: ${sttErr.message}. Make sure the Sarvam token is valid.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              language: selectedLanguage,
            },
          ]);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required to use speech input. Please allow mic permissions in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // Quick prompt chips
  const quickPrompts = [
    {
      en: "What's the transformer status?",
      hi: "ट्रांसफॉर्मर की अभी क्या हालत है?",
      ta: "டிரான்ஸ்பார்மர் இப்போ எப்படி இருக்கு?",
    },
    {
      en: "What action should we take now?",
      hi: "अभी क्या एक्शन लेना चाहिए?",
      ta: "இப்போ என்ன நடவடிக்கை எடுக்கணும்?",
    },
    {
      en: "Explain the Duval Triangle reading",
      hi: "डुवाल ट्रायंगल क्या दिखा रहा है?",
      ta: "டுவால் ட்ரையாங்கிள் என்ன சொல்லுது?",
    },
    {
      en: "Is the cellulose paper safe?",
      hi: "क्या कागज इंसुलेशन सुरक्षित है?",
      ta: "பேப்பர் இன்சுலேஷன் சேஃபா இருக்கா?",
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-2xl h-[90vh] max-h-[780px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans">
          
          {/* Top Decorative Cyber Gradient */}
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-amber-500" />

          {/* Header Bar */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                <Bot className="w-5 h-5" />
                {currentlyPlayingId && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Substation AI Voice Bot
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                      Sarvam AI
                    </span>
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Tone: Casual Substation Engineer
                  </span>
                </div>
              </div>
            </div>

            {/* Token Status & Close */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsKeyModalOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition cursor-pointer ${
                  apiKey
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 animate-pulse'
                }`}
                title={apiKey ? 'Sarvam API Token Connected - Click to change' : 'No Token Set - Click to add Sarvam API Key'}
              >
                <Key className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">
                  {apiKey ? 'Token Connected' : 'Add Sarvam Key'}
                </span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Missing Token Banner if no API key is set */}
          {!apiKey && (
            <div className="p-3 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Sarvam AI Token Required:</strong> Add your token to activate voice generation and speech recognition.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="https://dashboard.sarvam.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 text-white font-medium hover:bg-amber-600 transition"
                >
                  <span>Get Free Token</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setIsKeyModalOpen(true)}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 font-semibold hover:bg-amber-50 transition cursor-pointer"
                >
                  Enter Key
                </button>
              </div>
            </div>
          )}

          {/* Language & Voice Controls Bar (3 Languages) */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* 3 Languages Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5" /> Language:
              </span>
              <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                {SARVAM_LANGUAGES.map((lang) => {
                  const isActive = selectedLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-cyan-600 text-white shadow-sm font-bold'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.nativeLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voice Speaker Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Speaker:</span>
              <select
                value={selectedSpeaker}
                onChange={(e) => handleSpeakerChange(e.target.value)}
                className="px-2 py-0.5 text-[11px] font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                {SARVAM_SPEAKERS.map((spk) => (
                  <option key={spk.id} value={spk.id}>
                    {spk.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Substation Live Telemetry Ribbon (Context Awareness) */}
          <div className="px-4 py-1.5 bg-slate-100/60 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto gap-4">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Live Status:</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">{transformerContext.scenarioName}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span>Duval: <strong className="text-slate-800 dark:text-slate-200">{transformerContext.duvalZone}</strong></span>
              <span>TDCG: <strong className="text-slate-800 dark:text-slate-200">{transformerContext.tdcg.toFixed(0)} ppm</strong></span>
              <span>C₂H₂: <strong className="text-slate-800 dark:text-slate-200">{transformerContext.currentGases.C2H2} ppm</strong></span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-white dark:bg-slate-900">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isPlaying = currentlyPlayingId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-sm ${
                      isUser
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[82%] rounded-2xl p-3 text-xs shadow-sm transition ${
                      isUser
                        ? 'bg-cyan-600 text-white rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 rounded-tl-none'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    <div className="mt-2 pt-1.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{msg.timestamp}</span>

                      {!isUser && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => (isPlaying ? stopCurrentAudio() : playAudio(msg))}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-mono transition cursor-pointer ${
                              isPlaying
                                ? 'bg-cyan-500 text-white animate-pulse'
                                : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {isPlaying ? (
                              <>
                                <Square className="w-3 h-3 fill-current" />
                                <span>Stop Voice</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3" />
                                <span>Play Voice</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Animated Sound Waves while playing */}
                    {isPlaying && (
                      <div className="mt-2 flex items-center gap-1 justify-center py-1 bg-cyan-950/20 rounded">
                        <span className="w-1 h-3 bg-cyan-500 animate-pulse rounded-full" />
                        <span className="w-1 h-5 bg-cyan-400 animate-pulse delay-75 rounded-full" />
                        <span className="w-1 h-2 bg-cyan-500 animate-pulse delay-150 rounded-full" />
                        <span className="w-1 h-6 bg-cyan-300 animate-pulse delay-200 rounded-full" />
                        <span className="w-1 h-3 bg-cyan-500 animate-pulse delay-100 rounded-full" />
                        <span className="text-[10px] text-cyan-500 font-mono ml-2 font-medium">Speaking via Sarvam AI...</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="rounded-2xl rounded-tl-none p-3 bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                  <span>Generating casual spoken diagnostic answer...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="text-slate-400 shrink-0 font-medium">Try asking:</span>
            {quickPrompts.map((p, idx) => {
              const chipText =
                selectedLanguage === 'hi-IN' ? p.hi : selectedLanguage === 'ta-IN' ? p.ta : p.en;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chipText)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  {chipText}
                </button>
              );
            })}
          </div>

          {/* Input & Microphone Bar */}
          <div className="p-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {/* Mic / Record Button */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition shadow-md cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20'
                }`}
                title={isRecording ? 'Click to stop and transcribe' : 'Click to speak (Sarvam STT)'}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isRecording && (
                  <span className="absolute -top-1 -right-1 text-[9px] font-mono bg-rose-800 text-white px-1 rounded-full">
                    {recordingSeconds}s
                  </span>
                )}
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder={
                    selectedLanguage === 'hi-IN'
                      ? 'ट्रांसफॉर्मर के बारे में कुछ भी पूछें या माइक दबाएं...'
                      : selectedLanguage === 'ta-IN'
                      ? 'டிரான்ஸ்பார்மர் பற்றி கேளுங்கள் அல்லது மைக்கை அழுத்தவும்...'
                      : 'Ask about gas levels, arcing, or actions, or click mic...'
                  }
                  className="w-full px-3.5 py-2.5 pr-10 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isProcessing}
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Hint Footer */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
              <span>
                Powered by <strong>Sarvam AI</strong> &bull; Bulbul TTS + Saaras STT
              </span>
              <button
                onClick={() => setIsKeyModalOpen(true)}
                className="text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Configure Token / Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sarvam Key Prompt Modal */}
      <SarvamKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeySaved={(newKey) => {
          setApiKey(newKey);
        }}
      />
    </>
  );
};
