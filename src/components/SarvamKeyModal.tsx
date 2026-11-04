// src/components/SarvamKeyModal.tsx
import React, { useState } from 'react';
import { 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  getSarvamApiKey, 
  setSarvamApiKey, 
  clearSarvamApiKey, 
  validateSarvamKey 
} from '../services/sarvamService';

interface SarvamKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export const SarvamKeyModal: React.FC<SarvamKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
}) => {
  const [apiKey, setApiKey] = useState<string>(() => getSarvamApiKey());
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();

    if (!cleanKey) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your Sarvam AI API subscription key to continue.',
      });
      return;
    }

    setIsValidating(true);
    setStatusMessage({
      type: 'info',
      text: 'Verifying subscription key with Sarvam AI servers...',
    });

    const validation = await validateSarvamKey(cleanKey);
    setIsValidating(false);

    if (validation.valid) {
      setSarvamApiKey(cleanKey);
      setStatusMessage({
        type: 'success',
        text: 'Token verified successfully! Voice Bot is ready to speak.',
      });
      setTimeout(() => {
        onKeySaved(cleanKey);
        onClose();
      }, 900);
    } else {
      // Even if validation call has a proxy quirk, allow saving if it looks like a valid key or let user confirm
      setStatusMessage({
        type: 'error',
        text: validation.error || 'Failed to verify key. Please double-check your token on the Sarvam dashboard.',
      });
    }
  };

  const handleForceSave = () => {
    const cleanKey = apiKey.trim();
    if (!cleanKey) return;
    setSarvamApiKey(cleanKey);
    onKeySaved(cleanKey);
    onClose();
  };

  const handleRemoveKey = () => {
    clearSarvamApiKey();
    setApiKey('');
    setStatusMessage({
      type: 'info',
      text: 'Sarvam API key removed from this browser.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Header Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-cyan-500 to-indigo-500" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Sarvam AI Voice Bot Token
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  Required
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Powers real-time Indian multilingual voice synthesis (Bulbul) &amp; recognition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* No Token Notice & Link to Sarvam AI */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Don't have a Sarvam API token yet?</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              You can get your free Sarvam AI subscription key from their developer portal:
            </p>
            <div className="pt-1 flex flex-wrap gap-2">
              <a
                href="https://dashboard.sarvam.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm transition hover:scale-[1.02] cursor-pointer"
              >
                <span>Get Token on Sarvam Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.sarvam.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 transition"
              >
                <span>About Sarvam.ai</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-amber-500/20">
              <strong>Quick 3-step guide:</strong> 1. Sign in at <code className="text-cyan-600 dark:text-cyan-400">dashboard.sarvam.ai</code> &rarr; 2. Click <strong>API Keys</strong> &rarr; 3. Generate key &amp; paste it below.
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveAndTest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Sarvam API Subscription Key (<span className="font-mono text-cyan-600 dark:text-cyan-400">api-subscription-key</span>)
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="e.g. sk-sa_... or your 32-character subscription key"
                  className="w-full px-3.5 py-2.5 pr-10 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Status Feedback */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : statusMessage.type === 'error'
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300'
                    : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-800 dark:text-cyan-300'
                }`}
              >
                {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />}
                {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />}
                {statusMessage.type === 'info' && <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin text-cyan-500" />}
                <div className="flex-1">
                  <span>{statusMessage.text}</span>
                  {statusMessage.type === 'error' && apiKey.trim().length > 10 && (
                    <button
                      type="button"
                      onClick={handleForceSave}
                      className="block mt-1 underline font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-900 cursor-pointer"
                    >
                      Save anyway &amp; proceed &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              {getSarvamApiKey() ? (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition"
                >
                  Clear Saved Key
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isValidating || !apiKey.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl shadow-md shadow-cyan-500/20 transition cursor-pointer"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Connect Voice Bot</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              Your token is saved locally in your browser storage and transmitted directly to Sarvam AI.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
