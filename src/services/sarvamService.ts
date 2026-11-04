// src/services/sarvamService.ts
// Integration with Sarvam AI APIs:
// - Text-to-Speech (Bulbul models)
// - Speech-to-Text (Saaras models)
// - Chat & Diagnostics Reasoning in Casual Language Tone (English, Hindi, Tamil)

export type SarvamLanguageCode = 'en-IN' | 'hi-IN' | 'ta-IN';

export interface SarvamLanguageOption {
  code: SarvamLanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
  defaultSpeaker: string;
}

export const SARVAM_LANGUAGES: SarvamLanguageOption[] = [
  {
    code: 'en-IN',
    label: 'English (Indian)',
    nativeLabel: 'English',
    flag: '🇮🇳',
    defaultSpeaker: 'meera',
  },
  {
    code: 'hi-IN',
    label: 'Hindi (हिंदी)',
    nativeLabel: 'हिंदी / Hinglish',
    flag: '🇮🇳',
    defaultSpeaker: 'meera',
  },
  {
    code: 'ta-IN',
    label: 'Tamil (தமிழ்)',
    nativeLabel: 'தமிழ்',
    flag: '🇮🇳',
    defaultSpeaker: 'meera',
  },
];

export const SARVAM_SPEAKERS = [
  { id: 'meera', name: 'Meera (Natural Female)', gender: 'Female' },
  { id: 'arvind', name: 'Arvind (Natural Male)', gender: 'Male' },
  { id: 'shubh', name: 'Shubh (Casual Expressive)', gender: 'Male' },
];

const LOCAL_STORAGE_KEY = 'sarvam_api_key';
const LOCAL_STORAGE_LANG = 'sarvam_selected_lang';
const LOCAL_STORAGE_SPEAKER = 'sarvam_selected_speaker';

// --- Token Management ---

export const getSarvamApiKey = (): string => {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const setSarvamApiKey = (key: string): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, key.trim());
  } catch (err) {
    console.error('Failed to save Sarvam API key in localStorage:', err);
  }
};

export const clearSarvamApiKey = (): void => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to remove Sarvam API key:', err);
  }
};

export const hasSarvamApiKey = (): boolean => {
  const key = getSarvamApiKey();
  return Boolean(key && key.length > 5);
};

export const getSavedLanguage = (): SarvamLanguageCode => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_LANG);
    if (saved === 'en-IN' || saved === 'hi-IN' || saved === 'ta-IN') {
      return saved;
    }
  } catch {}
  return 'en-IN';
};

export const setSavedLanguage = (lang: SarvamLanguageCode): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_LANG, lang);
  } catch {}
};

export const getSavedSpeaker = (): string => {
  try {
    return localStorage.getItem(LOCAL_STORAGE_SPEAKER) || 'meera';
  } catch {}
  return 'meera';
};

export const setSavedSpeaker = (speaker: string): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_SPEAKER, speaker);
  } catch {}
};

// --- URL Resolver for Vite Dev Proxy & Production ---
const resolveApiUrl = (endpoint: string): { primary: string; direct: string } => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return {
    primary: `/api/sarvam${cleanEndpoint}`,
    direct: `https://api.sarvam.ai${cleanEndpoint}`,
  };
};

// --- Sarvam API Key Verification ---
export const validateSarvamKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  if (!apiKey || apiKey.trim().length < 8) {
    return { valid: false, error: 'Please enter a valid Sarvam subscription key.' };
  }

  const cleanKey = apiKey.trim();
  const urls = resolveApiUrl('/text-to-speech');

  // Test lightweight TTS request
  const testPayload = {
    text: 'Test',
    language_code: 'en-IN',
    model: 'bulbul:v3',
    speaker: 'meera',
  };

  const tryRequest = async (url: string) => {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': cleanKey,
      },
      body: JSON.stringify(testPayload),
    });
  };

  try {
    let res: Response;
    try {
      res = await tryRequest(urls.primary);
    } catch {
      res = await tryRequest(urls.direct);
    }

    if (res.ok) {
      return { valid: true };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        valid: false,
        error: 'Unauthorized (401/403): The Sarvam token is invalid or inactive. Please verify at dashboard.sarvam.ai.',
      };
    }

    const errJson = await res.json().catch(() => null);
    const detail = errJson?.message || errJson?.detail || `Status code: ${res.status}`;
    return { valid: false, error: `Sarvam API error: ${detail}` };
  } catch (err: any) {
    return {
      valid: false,
      error: err?.message || 'Network error connecting to Sarvam AI. Check your connection.',
    };
  }
};

// --- Text-to-Speech (TTS) ---
export interface SynthesizeOptions {
  text: string;
  languageCode: SarvamLanguageCode;
  speaker?: string;
  apiKey?: string;
  pace?: number;
}

export const synthesizeSpeech = async (
  options: SynthesizeOptions
): Promise<{ audioUrl: string; audioBase64?: string }> => {
  const apiKey = options.apiKey || getSarvamApiKey();
  if (!apiKey) {
    throw new Error('Sarvam API key is required. Please provide your token.');
  }

  const urls = resolveApiUrl('/text-to-speech');
  const payload = {
    text: options.text,
    language_code: options.languageCode,
    speaker: options.speaker || getSavedSpeaker(),
    model: 'bulbul:v3',
    pace: options.pace ?? 1.05,
    speech_sample_rate: 24000,
  };

  const tryCall = async (url: string) => {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify(payload),
    });
  };

  let response: Response;
  try {
    response = await tryCall(urls.primary);
    if (!response.ok && response.status === 404) {
      response = await tryCall(urls.direct);
    }
  } catch {
    response = await tryCall(urls.direct);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Sarvam TTS error (${response.status}): ${errorBody || response.statusText}`);
  }

  const data = await response.json();
  const base64Audio = Array.isArray(data.audios) ? data.audios[0] : (data.audio || data.audios);

  if (!base64Audio) {
    throw new Error('No audio data received in Sarvam TTS response');
  }

  const audioUrl = `data:audio/wav;base64,${base64Audio}`;
  return { audioUrl, audioBase64: base64Audio };
};

// --- Speech-to-Text (STT) ---
export interface TranscribeOptions {
  audioBlob: Blob;
  languageCode?: SarvamLanguageCode;
  apiKey?: string;
  prompt?: string;
}

export const transcribeAudio = async (
  options: TranscribeOptions
): Promise<{ transcript: string; detectedLanguage?: string }> => {
  const apiKey = options.apiKey || getSarvamApiKey();
  if (!apiKey) {
    throw new Error('Sarvam API key is required. Please provide your token.');
  }

  const urls = resolveApiUrl('/speech-to-text');
  const formData = new FormData();
  formData.append('file', options.audioBlob, 'user_audio.wav');
  formData.append('model', 'saaras:v4');
  formData.append('mode', 'transcribe');
  if (options.prompt) {
    formData.append('prompt', options.prompt);
  }

  const tryCall = async (url: string) => {
    return fetch(url, {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
      },
      body: formData,
    });
  };

  let response: Response;
  try {
    response = await tryCall(urls.primary);
    if (!response.ok && response.status === 404) {
      response = await tryCall(urls.direct);
    }
  } catch {
    response = await tryCall(urls.direct);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Sarvam STT failed (${response.status}): ${errText || response.statusText}`);
  }

  const data = await response.json();
  return {
    transcript: data.transcript || '',
    detectedLanguage: data.language_code,
  };
};

// --- Transformer Context Interface for Live Reasoning ---
export interface LiveTransformerContext {
  scenarioName: string;
  scenarioCode: string;
  currentGases: {
    H2: number;
    CH4: number;
    C2H6: number;
    C2H4: number;
    C2H2: number;
    CO: number;
    CO2: number;
  };
  tdcg: number;
  tdcgCondition: string;
  duvalZone: string;
  duvalZoneCode: string;
  duvalPercentages: {
    ch4: number;
    c2h4: number;
    c2h2: number;
  };
  celluloseRatio: number;
  paperRisk: string;
  recommendedAction: string;
  urgency: string;
}

// --- Casual Response Generator (Multi-Language, Casual Tone) ---
export const generateCasualResponse = async (
  userQuery: string,
  context: LiveTransformerContext,
  language: SarvamLanguageCode,
  apiKey?: string
): Promise<string> => {
  const cleanKey = apiKey || getSarvamApiKey();

  // Try Sarvam Chat Completion if key is available
  if (cleanKey) {
    try {
      const urls = resolveApiUrl('/v1/chat/completions');
      const langPrompt =
        language === 'hi-IN'
          ? 'Respond in casual, conversational Hindi / Hinglish. Speak like a friendly Indian electrical substation engineer having a casual chat with a peer. Keep it to 2-3 short, spoken sentences.'
          : language === 'ta-IN'
          ? 'Respond in casual, conversational spoken Tamil. Speak like a friendly Tamil Nadu substation engineer chatting with a colleague. Keep it to 2-3 short, spoken sentences.'
          : 'Respond in casual, friendly Indian English. Speak like a smart, approachable substation engineer giving quick advice to a teammate in the control room. Keep it to 2-3 short, punchy sentences.';

      const systemPrompt = `You are 'VoltBot', a friendly, casual power transformer diagnostic AI assistant in a substation control room.
Your tone MUST be casual, warm, conversational, and direct—never robotic or stuffy. Avoid markdown tables or bullet points; speak naturally so it can be read aloud via Text-to-Speech.
Live Transformer Status:
- Scenario: ${context.scenarioName} (${context.scenarioCode})
- Live Gases (ppm): H2=${context.currentGases.H2}, CH4=${context.currentGases.CH4}, C2H6=${context.currentGases.C2H6}, C2H4=${context.currentGases.C2H4}, C2H2=${context.currentGases.C2H2}, CO=${context.currentGases.CO}, CO2=${context.currentGases.CO2}
- TDCG Combustibles: ${context.tdcg.toFixed(0)} ppm (${context.tdcgCondition})
- Duval Triangle 1: ${context.duvalZone} (%CH4=${context.duvalPercentages.ch4.toFixed(1)}%, %C2H4=${context.duvalPercentages.c2h4.toFixed(1)}%, %C2H2=${context.duvalPercentages.c2h2.toFixed(1)}%)
- Cellulose / Paper: CO2/CO=${context.celluloseRatio.toFixed(1)}, Risk=${context.paperRisk}
- Primary Recommendation: ${context.recommendedAction} (Urgency: ${context.urgency})

Directive: ${langPrompt}`;

      const chatPayload = {
        model: 'sarvam-105b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.7,
        max_tokens: 220,
      };

      const tryChat = async (url: string) => {
        return fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': cleanKey,
          },
          body: JSON.stringify(chatPayload),
        });
      };

      let chatRes: Response;
      try {
        chatRes = await tryChat(urls.primary);
        if (!chatRes.ok && chatRes.status === 404) {
          chatRes = await tryChat(urls.direct);
        }
      } catch {
        chatRes = await tryChat(urls.direct);
      }

      if (chatRes.ok) {
        const json = await chatRes.json();
        const text = json?.choices?.[0]?.message?.content?.trim();
        if (text && text.length > 5) {
          return text;
        }
      }
    } catch (e) {
      console.warn('Sarvam Chat completion fallback to smart local reasoning:', e);
    }
  }

  // Smart Context-Aware Local Casual Engine (Zero latency, reliable fallback)
  return buildLocalCasualResponse(userQuery, context, language);
};

// --- High-Quality Spoken Casual Reasoning Engine ---
function buildLocalCasualResponse(
  query: string,
  ctx: LiveTransformerContext,
  lang: SarvamLanguageCode
): string {
  const q = query.toLowerCase();
  const isHealthy = ctx.scenarioCode === 'NORM' && ctx.duvalZoneCode === 'Normal';
  const isArcing = ctx.duvalZoneCode === 'D1' || ctx.duvalZoneCode === 'D2';
  const isThermal = ctx.duvalZoneCode.startsWith('T');
  const isPD = ctx.duvalZoneCode === 'PD';
  const isPaper = ctx.paperRisk === 'High' || ctx.scenarioCode === 'CELL';

  // --- ENGLISH (CASUAL TONE) ---
  if (lang === 'en-IN') {
    if (q.includes('action') || q.includes('do') || q.includes('mitigat') || q.includes('step') || q.includes('fix')) {
      if (isHealthy) {
        return `We're totally clear right now! Just keep standard SCADA logging going and run the regular 6-month oil check. No emergency moves needed.`;
      }
      if (isArcing) {
        return `Heads up, this is critical! Trip or unload the transformer immediately, isolate the bay, and take an urgent oil sample for breakdown voltage testing.`;
      }
      if (isThermal) {
        return `Best move right now is checking the oil pumps and cooling fans. We should drop load by at least 20 percent and scan the tank with infrared right away.`;
      }
      return `Here's what we should do: ${ctx.recommendedAction}. Urgency is ${ctx.urgency}, so let's get on it before this escalates!`;
    }

    if (q.includes('paper') || q.includes('cellulose') || q.includes('insulation') || q.includes('co2')) {
      if (isPaper) {
        return `Watch out for the kraft paper! The CO2 to CO ratio is down at ${ctx.celluloseRatio.toFixed(1)}, meaning the paper wrapping is actively cooking. Paper damage cannot be reversed, so let's derate immediately.`;
      }
      return `Cellulose looks solid. CO2 to CO ratio is healthy at ${ctx.celluloseRatio.toFixed(1)}, so solid paper degradation risk is minimal right now.`;
    }

    if (q.includes('duval') || q.includes('triangle')) {
      return `Duval Triangle 1 is currently pointing right at ${ctx.duvalZone}, with Methane at ${ctx.duvalPercentages.ch4.toFixed(0)}%, Ethylene at ${ctx.duvalPercentages.c2h4.toFixed(0)}%, and Acetylene at ${ctx.duvalPercentages.c2h2.toFixed(0)}%. ${isArcing ? 'That acetylene percentage is a clear warning sign of active electrical discharge!' : 'Coordinates are well within expected parameters.'}`;
    }

    if (q.includes('gas') || q.includes('acetylene') || q.includes('hydrogen') || q.includes('methane') || q.includes('ppm')) {
      return `Current gas snapshot: Hydrogen is ${ctx.currentGases.H2} ppm, Acetylene is ${ctx.currentGases.C2H2} ppm, and Ethylene is ${ctx.currentGases.C2H4} ppm. Total combustible gases (TDCG) stand at ${ctx.tdcg.toFixed(0)} ppm (${ctx.tdcgCondition}).`;
    }

    // Default status summary
    if (isHealthy) {
      return `Hey there! Everything is running super smooth right now. TDCG is calm at ${ctx.tdcg.toFixed(0)} ppm, Duval zone is Normal, and all gases are well below IEEE alert limits. You're good to go!`;
    }
    if (isArcing) {
      return `Whoa, watch out! We've got ${ctx.duvalZone} brewing. Acetylene has spiked to ${ctx.currentGases.C2H2} ppm, which means high-energy electrical arcing inside the tank. We need to act quickly!`;
    }
    if (isThermal) {
      return `Hey! We've got a hotspot going on—Ethylene is dominant, pointing to ${ctx.duvalZone}. Check the cooling bank and thermal imaging immediately!`;
    }
    if (isPD) {
      return `Hey! Hydrogen is creeping up at ${ctx.currentGases.H2} ppm, indicating Partial Discharge in oil or paper cavities. Let's inspect the bushings and acoustic sensors before it gets worse.`;
    }
    return `Hey! Current status is ${ctx.scenarioName} with TDCG at ${ctx.tdcg.toFixed(0)} ppm. ${ctx.recommendedAction}`;
  }

  // --- HINDI (CASUAL HINGLISH TONE) ---
  if (lang === 'hi-IN') {
    if (q.includes('action') || q.includes('karna') || q.includes('kya kare') || q.includes('step') || q.includes('उपाय')) {
      if (isHealthy) {
        return `अरे भाई, अभी सब चंगा है! बस रूटीन मॉनिटरिंग चालू रखो और 6 महीने वाला ऑइल टेस्ट समय पर करा लेना। कोई टेंशन वाली बात नहीं है।`;
      }
      if (isArcing) {
        return `अरे ध्यान दो, यह काफी सीरियस है! तुरंत लोड कम करो या ट्रांसफॉर्मर आइसोलेट करो, और ऑइल का ब्रेकडाउन वोल्टेज टेस्ट तुरंत करवाओ!`;
      }
      if (isThermal) {
        return `अभी सबसे पहले कूलिंग फैन्स और रेडिएटर पंप्स चेक करो। लोड कम से कम 20% घटाओ और टैंक का इन्फ्रारेड थर्मल स्कैन करो।`;
      }
      return `अगला कदम यह है: ${ctx.recommendedAction}। मामला ${ctx.urgency} लेवल का है, इसलिए बिना देर किए टीम को अलर्ट करो!`;
    }

    if (q.includes('paper') || q.includes('cellulose') || q.includes('कागज') || q.includes('insulation')) {
      if (isPaper) {
        return `अरे सुनो, पेपर इंसुलेशन खतरे में है! CO2/CO रेशियो गिरकर ${ctx.celluloseRatio.toFixed(1)} हो गया है, यानी वाइंडिंग का क्राफ्ट पेपर जल रहा है। यह दोबारा ठीक नहीं होता, लोड तुरंत घटाओ!`;
      }
      return `कागज इंसुलेशन एकदम सुरक्षित है। CO2/CO रेशियो ${ctx.celluloseRatio.toFixed(1)} है, यानी सेलूलोज़ पर कोई आंच नहीं आई है।`;
    }

    if (q.includes('duval') || q.includes('triangle') || q.includes('डुवाल')) {
      return `डुवाल ट्रायंगल अभी ${ctx.duvalZone} दिखा रहा है, जिसमें Methane ${ctx.duvalPercentages.ch4.toFixed(0)}%, Ethylene ${ctx.duvalPercentages.c2h4.toFixed(0)}%, और Acetylene ${ctx.duvalPercentages.c2h2.toFixed(0)}% है। ${isArcing ? 'यह Acetylene साफ़ बता रहा है कि अंदर स्पार्क या आर्किंग है!' : 'रीडिंग्स एकदम नियंत्रण में हैं।'}`;
    }

    if (q.includes('gas') || q.includes('गैस') || q.includes('ppm') || q.includes('reading')) {
      return `गैस की ताज़ा स्थिति: Hydrogen ${ctx.currentGases.H2} ppm, Acetylene ${ctx.currentGases.C2H2} ppm, और Ethylene ${ctx.currentGases.C2H4} ppm है। कुल ज्वलनशील गैस (TDCG) ${ctx.tdcg.toFixed(0)} ppm पर है।`;
    }

    // Default status summary
    if (isHealthy) {
      return `नमस्ते भाई! ट्रांसफॉर्मर का हाल एकदम मस्त है। TDCG सिर्फ ${ctx.tdcg.toFixed(0)} ppm है और सारे गैसेस सेफ लिमिट में हैं। कोई गड़बड़ नहीं दिख रही!`;
    }
    if (isArcing) {
      return `अरे अलर्ट! ट्रांसफॉर्मर में कुछ जल रहा है—Acetylene ${ctx.currentGases.C2H2} ppm तक पहुँच गया है और डुवाल ट्रायंगल ${ctx.duvalZone} दिखा रहा है। तुरंत रिले और ब्रेकर चेक करो!`;
    }
    if (isThermal) {
      return `सुनो, अंदर काफी गरमी बढ़ गई है! Ethylene बढ़ रहा है और डुवाल में ${ctx.duvalZone} आ रहा है। फैन्स और रेडिएटर तुरंत चेक करने पड़ेंगे!`;
    }
    if (isPD) {
      return `यहाँ Hydrogen ${ctx.currentGases.H2} ppm हो गया है, जो पार्शियल डिस्चार्ज का पक्का सिग्नल है। बुशिंग्स और ऑइल की जांच करवा लो भाई!`;
    }
    return `अभी ट्रांसफॉर्मर का स्टेटस है: ${ctx.scenarioName}। TDCG ${ctx.tdcg.toFixed(0)} ppm है। ${ctx.recommendedAction}`;
  }

  // --- TAMIL (CASUAL SPOKEN TONE) ---
  if (lang === 'ta-IN') {
    if (q.includes('action') || q.includes('enna') || q.includes('seiyanum') || q.includes('step') || q.includes('நடவடிக்கை')) {
      if (isHealthy) {
        return `பாஸ், இப்போதைக்கு எல்லாம் பக்காவா இருக்கு! வழக்கமான ஸ்காடா மானிட்டரிங் பண்ணா போதும், எந்த அவசர ஆக்ஷனும் தேவையில்லை.`;
      }
      if (isArcing) {
        return `பாஸ் உஷாரா இருங்க, இது ரொம்ப சீரியஸ்! உடனே டிரான்ஸ்பார்மரை ட்ரிப் பண்ணி ஐசோலேட் பண்ணுங்க, ஆயில் பிரேக் டவுன் வோல்டேஜ் டெஸ்ட் உடனே எடுக்கணும்!`;
      }
      if (isThermal) {
        return `முதல்ல கூலிங் பேன்ஸ் மற்றும் ஆயில் பம்பை செக் பண்ணுங்க பாஸ். லோட குறைஞ்சது இருவது சதவீதம் குறைச்சுட்டு இன்ஃப்ராரெட் ஸ்கேன் பண்ணுங்க.`;
      }
      return `அடுத்த ஸ்டெப்: ${ctx.recommendedAction} பாஸ். இது ரொம்ப முக்கியம், தாமதிக்காம செக் பண்ணுங்க!`;
    }

    if (q.includes('paper') || q.includes('cellulose') || q.includes('இன்சுலேஷன்')) {
      if (isPaper) {
        return `கவனியுங்க பாஸ்! CO2/CO ரேஷியோ ${ctx.celluloseRatio.toFixed(1)}-ஆ குறைஞ்சிடுச்சு. வைண்டிங் பேப்பர் இன்சுலேஷன் டேமேஜ் ஆகுது, உடனடியா லோட குறைக்கணும்!`;
      }
      return `பேப்பர் இன்சுலேஷன் நல்ல கண்டிஷன்ல தான் இருக்கு பாஸ். CO2/CO ரேஷியோ ${ctx.celluloseRatio.toFixed(1)}-ல சேஃபா இருக்கு.`;
    }

    if (q.includes('duval') || q.includes('triangle')) {
      return `டுவால் ட்ரையாங்கிள் இப்போ ${ctx.duvalZone} காட்டுது. மீத்தேன் ${ctx.duvalPercentages.ch4.toFixed(0)}%, எத்திலீன் ${ctx.duvalPercentages.c2h4.toFixed(0)}%, அசிட்டிலின் ${ctx.duvalPercentages.c2h2.toFixed(0)}%. ${isArcing ? 'அசிட்டிலின் அதிகமா இருக்கிறது எலக்ட்ரிக்கல் ஆர்க்கிங் அறிகுறி!' : 'எல்லாம் கட்டுப்பாட்டுக்குள் இருக்கு.'}`;
    }

    if (q.includes('gas') || q.includes('ppm') || q.includes('reading')) {
      return `தற்போதைய கேஸ் அளவு: ஹைட்ரஜன் ${ctx.currentGases.H2} ppm, அசிட்டிலின் ${ctx.currentGases.C2H2} ppm, எத்திலீன் ${ctx.currentGases.C2H4} ppm. மொத்த TDCG அளவு ${ctx.tdcg.toFixed(0)} ppm.`;
    }

    // Default status summary
    if (isHealthy) {
      return `வணக்கம் பாஸ்! டிரான்ஸ்பார்மர் எந்த பிரச்சனையும் இல்லாம சூப்பரா இயங்குது. TDCG ${ctx.tdcg.toFixed(0)} ppm தான், எல்லா கேஸ்களும் சேஃப் லிமிட்டுல இருக்கு!`;
    }
    if (isArcing) {
      return `ஐயோ பாஸ், டேங்க் உள்ள பெரிய ஸ்பார்க் அடிக்குது! அசிட்டிலின் ${ctx.currentGases.C2H2} ppm வரை ஏறிடுச்சு, டுவால் ட்ரையாங்கிள் ${ctx.duvalZone} காட்டுது. உடனே கவனியுங்க!`;
    }
    if (isThermal) {
      return `பாஸ் உள்ள பயங்கரமா சூடாகி இருக்கு! எத்திலீன் அதிகமா இருக்கு, டுவால் ட்ரையாங்கிள் ${ctx.duvalZone} காட்டுது. கூலிங் சிஸ்டத்தை உடனே பாருங்க!`;
    }
    if (isPD) {
      return `ஹைட்ரஜன் அளவு ${ctx.currentGases.H2} ppm-க்கு போயிருச்சு பாஸ், இது பார்ஷியல் டிஸ்சார்ஜ் ஆகுதுன்னு அர்த்தம். புஷிங்ஸை சீக்கிரமா செக் பண்ணிடுங்க!`;
    }
    return `வணக்கம் பாஸ்! இப்போ நிலைமை: ${ctx.scenarioName}. TDCG ${ctx.tdcg.toFixed(0)} ppm. ${ctx.recommendedAction}`;
  }

  return `Current transformer status is ${ctx.scenarioName} with TDCG at ${ctx.tdcg.toFixed(0)} ppm. Recommended action: ${ctx.recommendedAction}`;
}
