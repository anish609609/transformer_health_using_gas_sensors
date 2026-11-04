// src/services/sarvamService.ts
// Integration with Sarvam AI APIs:
// - Text-to-Speech (Bulbul models)
// - Speech-to-Text (Saaras models)
// - Chat & Diagnostics Reasoning in Casual Language Tone (English, Telugu, Hindi)

export type SarvamLanguageCode = 'en-IN' | 'te-IN' | 'hi-IN';

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
    defaultSpeaker: 'kavya',
  },
  {
    code: 'te-IN',
    label: 'Telugu (తెలుగు)',
    nativeLabel: 'తెలుగు',
    flag: '🇮🇳',
    defaultSpeaker: 'kavya',
  },
  {
    code: 'hi-IN',
    label: 'Hindi (हिंदी)',
    nativeLabel: 'हिंदी / Hinglish',
    flag: '🇮🇳',
    defaultSpeaker: 'kavya',
  },
];

export const SARVAM_SPEAKERS = [
  { id: 'kavya', name: 'Kavya (Natural Female)', gender: 'Female' },
  { id: 'aditya', name: 'Aditya (Natural Male)', gender: 'Male' },
  { id: 'shubh', name: 'Shubh (Casual Expressive)', gender: 'Male' },
];

const LOCAL_STORAGE_KEY = 'sarvam_api_key';
const LOCAL_STORAGE_LANG = 'sarvam_selected_lang';
const LOCAL_STORAGE_SPEAKER = 'sarvam_selected_speaker';

// --- Token Management ---

export const getSarvamApiKey = (): string => {
  try {
    return (localStorage.getItem(LOCAL_STORAGE_KEY) || '').trim();
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
    if (saved === 'en-IN' || saved === 'te-IN' || saved === 'hi-IN') {
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
    const saved = localStorage.getItem(LOCAL_STORAGE_SPEAKER);
    if (saved === 'kavya' || saved === 'aditya' || saved === 'shubh') {
      return saved;
    }
  } catch {}
  return 'kavya';
};

export const setSavedSpeaker = (speaker: string): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_SPEAKER, speaker);
  } catch {}
};

// --- Resilient HTTP Endpoint Dispatcher ---
// Tries direct https://api.sarvam.ai first (since Sarvam returns Access-Control-Allow-Origin: *).
// If direct call fails due to network/firewall, gracefully falls back to local proxy /api/sarvam.
async function callSarvamEndpoint(endpoint: string, options: RequestInit): Promise<Response> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const directUrl = `https://api.sarvam.ai${cleanEndpoint}`;
  const proxyUrl = `/api/sarvam${cleanEndpoint}`;

  try {
    const res = await fetch(directUrl, options);
    // If we received an actual HTTP response from Sarvam (even 4xx/5xx), return it directly.
    return res;
  } catch (directError) {
    console.warn(`Direct fetch to ${directUrl} had a network error. Trying proxy ${proxyUrl}...`, directError);
    return fetch(proxyUrl, options);
  }
}

// --- Sarvam API Key Verification ---
export const validateSarvamKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  if (!apiKey || apiKey.trim().length < 8) {
    return { valid: false, error: 'Please enter a valid Sarvam subscription key.' };
  }

  const cleanKey = apiKey.trim();

  // Test lightweight TTS request using official Sarvam Bulbul v3 schema
  const testPayload = {
    text: 'Hello',
    target_language_code: 'en-IN',
    model: 'bulbul:v3',
    speaker: 'kavya',
  };

  try {
    const res = await callSarvamEndpoint('/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': cleanKey,
      },
      body: JSON.stringify(testPayload),
    });

    if (res.ok) {
      return { valid: true };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        valid: false,
        error: 'Unauthorized (401/403): The Sarvam token is invalid or inactive. Please verify at dashboard.sarvam.ai.',
      };
    }

    if (res.status === 429) {
      return {
        valid: false,
        error: 'Rate limit or quota reached on Sarvam AI. Check your account at dashboard.sarvam.ai.',
      };
    }

    const errJson = await res.json().catch(() => null);
    const detail =
      errJson?.error?.message ||
      errJson?.message ||
      (Array.isArray(errJson?.detail) ? errJson.detail.map((d: any) => d.msg || d).join(', ') : errJson?.detail) ||
      `HTTP status ${res.status}`;

    return { valid: false, error: `Sarvam AI response: ${detail}` };
  } catch (err: any) {
    return {
      valid: false,
      error: `Network error: ${err?.message || 'Could not connect to Sarvam AI'}. Check your internet connection.`,
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

  // Official Sarvam Bulbul request schema (uses 'text' and 'target_language_code' with bulbul:v3)
  const payload = {
    text: options.text,
    target_language_code: options.languageCode,
    speaker: options.speaker || getSavedSpeaker(),
    pitch: 0,
    pace: options.pace ?? 1.0,
    loudness: 1.5,
    speech_sample_rate: 24000,
    enable_preprocessing: true,
    model: 'bulbul:v3',
  };

  const response = await callSarvamEndpoint('/text-to-speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    const msg = errorJson?.error?.message || errorJson?.message || response.statusText;
    throw new Error(`Sarvam TTS error (${response.status}): ${msg}`);
  }

  const data = await response.json();
  const base64Audio = Array.isArray(data.audios)
    ? data.audios[0]
    : typeof data.audio === 'string'
    ? data.audio
    : typeof data.audios === 'string'
    ? data.audios
    : null;

  if (!base64Audio) {
    throw new Error('No audio returned by Sarvam TTS response');
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

  const formData = new FormData();
  formData.append('file', options.audioBlob, 'user_audio.wav');
  formData.append('model', 'saaras:v4');
  formData.append('mode', 'transcribe');
  if (options.languageCode) {
    formData.append('language_code', options.languageCode);
  }
  if (options.prompt) {
    formData.append('prompt', options.prompt);
  }

  const response = await callSarvamEndpoint('/speech-to-text', {
    method: 'POST',
    headers: {
      'api-subscription-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    const msg = errJson?.error?.message || errJson?.message || response.statusText;
    throw new Error(`Sarvam STT failed (${response.status}): ${msg}`);
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

// --- Casual Response Generator (English, Telugu, Hindi) ---
export const generateCasualResponse = async (
  userQuery: string,
  context: LiveTransformerContext,
  language: SarvamLanguageCode,
  apiKey?: string
): Promise<string> => {
  const cleanKey = apiKey || getSarvamApiKey();

  // Try Sarvam Chat Completion if token is present
  if (cleanKey) {
    try {
      const langPrompt =
        language === 'te-IN'
          ? 'Respond in casual, conversational Telugu (తెలుగు). Speak like a friendly electrical substation engineer in Andhra Pradesh / Telangana chatting with a colleague in the control room. Keep it to 2-3 short, spoken sentences.'
          : language === 'hi-IN'
          ? 'Respond in casual, conversational Hindi / Hinglish. Speak like a friendly Indian electrical substation engineer having a casual chat with a peer. Keep it to 2-3 short, spoken sentences.'
          : 'Respond in casual, friendly Indian English. Speak like a smart, approachable substation engineer giving quick advice to a teammate in the control room. Keep it to 2-3 short, punchy sentences.';

      const systemPrompt = `You are 'VoltBot', a friendly, casual power transformer diagnostic AI assistant in a substation control room.
Your tone MUST be casual, warm, conversational, and direct—never robotic or stuffy. Avoid markdown formatting or bullet points; speak naturally so it sounds great when read aloud via Text-to-Speech.
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

      const chatRes = await callSarvamEndpoint('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': cleanKey,
        },
        body: JSON.stringify(chatPayload),
      });

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

  // --- 1. ENGLISH (CASUAL TONE) ---
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

  // --- 2. TELUGU (CASUAL SPOKEN TONE) ---
  if (lang === 'te-IN') {
    if (q.includes('action') || q.includes('charyalu') || q.includes('em cheyali') || q.includes('step') || q.includes('చర్య')) {
      if (isHealthy) {
        return `బాస్, అంతా సేఫ్‌గా ఉంది! రెగ్యులర్ స్కాడా మానిటరింగ్ కంటిన్యూ చేయండి, 6 నెలల ఆయిల్ శాంపిల్ టెస్ట్ టైంకి తీసుకుంటే చాలు. ఎమర్జెన్సీ ఏమీ లేదు.`;
      }
      if (isArcing) {
        return `బాస్ కొంచెం జాగ్రత్త, ఇది చాలా సీరియస్! వెంటనే ట్రాన్స్‌ఫార్మర్ లోడ్ తగ్గించి లేదా ఐసోలేట్ చేయండి, ఆయిల్ బ్రేక్‌డౌన్ వోల్టేజ్ (BDV) టెస్ట్ వెంటనే చేయించాలి!`;
      }
      if (isThermal) {
        return `ముందుగా కూలింగ్ ఫ్యాన్లు, ఆయిల్ పంపులు చెక్ చేయండి బాస్. లోడ్ కనీసం ఇరవై శాతం తగ్గించి, ట్యాంక్ ఇన్‌ఫ్రారెడ్ థర్మల్ స్కాన్ వెంటనే చేయించండి.`;
      }
      return `ఇప్పుడు చేయాల్సిన ముఖ్యమైన పని: ${ctx.recommendedAction} బాస్. ఇది ${ctx.urgency} లెవల్, ఏమాత్రం ఆలస్యం చేయకుండా టీమ్‌ను అలర్ట్ చేయండి!`;
    }

    if (q.includes('paper') || q.includes('cellulose') || q.includes('పేపర్') || q.includes('ఇన్సులేషన్') || q.includes('co2')) {
      if (isPaper) {
        return `బాస్ గమనించండి, పేపర్ ఇన్సులేషన్ ప్రమాదంలో ఉంది! CO2/CO నిష్పత్తి ${ctx.celluloseRatio.toFixed(1)} కి పడిపోయింది, అంటే వైండింగ్ పేపర్ కాలిపోతోంది. పేపర్ డ్యామేజ్ మళ్ళీ రివర్స్ కాదు, వెంటనే లోడ్ తగ్గించండి!`;
      }
      return `పేపర్ ఇన్సులేషన్ చాలా బాగుంది బాస్. CO2/CO నిష్పత్తి ${ctx.celluloseRatio.toFixed(1)} దగ్గర ఉంది, కాబట్టి సెల్లూలోజ్ డీగ్రేడేషన్ రిస్క్ ప్రస్తుతం లేదు.`;
    }

    if (q.includes('duval') || q.includes('triangle') || q.includes('డ్యూవల్')) {
      return `డ్యూవల్ ట్రయాంగిల్ 1 ప్రస్తుతం ${ctx.duvalZone} జోన్ చూపిస్తోంది. మీథేన్ ${ctx.duvalPercentages.ch4.toFixed(0)}%, ఇథిలీన్ ${ctx.duvalPercentages.c2h4.toFixed(0)}%, ఎసిటిలీన్ ${ctx.duvalPercentages.c2h2.toFixed(0)}%. ${isArcing ? 'ఈ ఎసిటిలీన్ శాతం స్పష్టంగా ఎలక్ట్రికల్ ఆర్కింగ్ సంకేతం!' : 'రీడింగ్స్ అన్నీ నార్మల్ పరిమితిలోనే ఉన్నాయి.'}`;
    }

    if (q.includes('gas') || q.includes('గ్యాస్') || q.includes('ppm') || q.includes('reading')) {
      return `ప్రస్తుత గ్యాస్ రీడింగ్స్: హైడ్రోజన్ ${ctx.currentGases.H2} ppm, ఎసిటిలీన్ ${ctx.currentGases.C2H2} ppm, ఇథిలీన్ ${ctx.currentGases.C2H4} ppm. మొత్తం దహనశీల వాయువులు (TDCG) ${ctx.tdcg.toFixed(0)} ppm (${ctx.tdcgCondition}).`;
    }

    // Default status summary
    if (isHealthy) {
      return `నమస్కారం బాస్! ట్రాన్స్‌ఫార్మర్ అంతా పక్కాగా నడుస్తోంది. TDCG ${ctx.tdcg.toFixed(0)} ppm మాత్రమే ఉంది, గ్యాసెస్ అన్నీ సేఫ్ లిమిట్ లోనే ఉన్నాయి. ఎలాంటి ఇబ్బందీ లేదు!`;
    }
    if (isArcing) {
      return `అలర్ట్ బాస్! ట్యాంక్ లోపల పెద్ద స్పార్క్ లేదా ఆర్కింగ్ జరుగుతోంది—ఎసిటిలీన్ ${ctx.currentGases.C2H2} ppm వరకు ఎగిసింది. డ్యూవల్ ట్రయాంగిల్ ${ctx.duvalZone} చూపిస్తోంది, వెంటనే బ్రేకర్‌ను చెక్ చేయండి!`;
    }
    if (isThermal) {
      return `బాస్ లోపల బాగా వేడెక్కుతోంది! ఇథిలీన్ పెరిగింది మరియు డ్యూవల్ ట్రయాంగిల్ ${ctx.duvalZone} చూపిస్తోంది. కూలింగ్ ఫ్యాన్లు, ఆయిల్ లెవల్ వెంటనే చూడాలి!`;
    }
    if (isPD) {
      return `హైడ్రోజన్ ${ctx.currentGases.H2} ppm కి చేరింది బాస్, ఇది పార్షియల్ డిశ్చార్జ్ సంకేతం. బుషింగ్స్ మరియు ఆయిల్ శాంపిల్ వెంటనే తనిఖీ చేయించండి!`;
    }
    return `బాస్! ప్రస్తుత స్టేటస్: ${ctx.scenarioName}. TDCG ${ctx.tdcg.toFixed(0)} ppm. ${ctx.recommendedAction}`;
  }

  // --- 3. HINDI (CASUAL HINGLISH TONE) ---
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

  return `Current transformer status is ${ctx.scenarioName} with TDCG at ${ctx.tdcg.toFixed(0)} ppm. Recommended action: ${ctx.recommendedAction}`;
}
