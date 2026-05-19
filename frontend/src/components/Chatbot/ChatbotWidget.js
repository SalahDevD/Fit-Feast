import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaLanguage,
  FaPaperPlane,
  FaRobot,
  FaTimes,
  FaVolumeUp,
} from 'react-icons/fa';
import { FiImage, FiMic, FiUploadCloud, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { chatbotAPI } from '../../api/axios';

const translationOptions = [
  { value: '', label: 'Auto', helper: 'Reply in the detected language' },
  { value: 'fr_to_en', label: 'FR -> EN', helper: 'Translate French responses to English' },
  { value: 'en_to_fr', label: 'EN -> FR', helper: 'Translate English responses to French' },
];

const detectMessageLanguage = (value = '') => {
  const normalized = value.toLowerCase();
  const frenchSignals = ['bonjour', 'commande', 'livraison', 'merci', 'plat', 'proteine', 'allergie'];
  const englishSignals = ['hello', 'order', 'delivery', 'thanks', 'meal', 'protein', 'allergy'];

  const frenchScore = frenchSignals.reduce(
    (score, token) => score + (normalized.includes(token) ? 1 : 0),
    0
  );
  const englishScore = englishSignals.reduce(
    (score, token) => score + (normalized.includes(token) ? 1 : 0),
    0
  );

  return frenchScore > englishScore ? 'fr' : 'en';
};

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [translationMode, setTranslationMode] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const currentInputLanguage = useMemo(
    () => detectMessageLanguage(inputValue),
    [inputValue]
  );

  const resetPendingFiles = () => {
    setImageFile(null);
    setAudioFile(null);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && !imageFile && !audioFile) {
      return;
    }

    const userMessage = inputValue.trim();
    const messageLanguage = currentInputLanguage;
    const userBubble =
      userMessage ||
      (imageFile && audioFile
        ? messageLanguage === 'fr'
          ? 'Image et audio joints'
          : 'Image and audio attached'
        : imageFile
          ? messageLanguage === 'fr'
            ? 'Image jointe'
            : 'Image attached'
          : messageLanguage === 'fr'
            ? 'Audio joint'
            : 'Audio attached');

    setInputValue('');
    setMessages((previous) => [
      ...previous,
      {
        role: 'user',
        content: userBubble,
        language: messageLanguage,
        attachments: {
          image: imageFile?.name || '',
          audio: audioFile?.name || '',
        },
      },
    ]);
    setLoading(true);

    try {
      let response;

      if (imageFile || audioFile) {
        const formData = new FormData();
        formData.append('message', userMessage);
        if (conversationId) {
          formData.append('conversation_id', conversationId);
        }
        if (translationMode) {
          formData.append('translation_mode', translationMode);
        }
        if (imageFile) {
          formData.append('image_file', imageFile);
        }
        if (audioFile) {
          formData.append('audio_file', audioFile);
        }
        response = await chatbotAPI.sendMessage(formData);
      } else {
        response = await chatbotAPI.sendMessage({
          message: userMessage,
          conversation_id: conversationId,
          translation_mode: translationMode,
        });
      }

      if (!conversationId) {
        setConversationId(response.data.conversation_id);
      }

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: response.data.response,
          language: response.data.language || messageLanguage,
        },
      ]);
      resetPendingFiles();
    } catch (error) {
      console.error('Chatbot request error', error);
      toast.error('The assistant could not answer right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const speakText = (text, language = 'en') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'fr' ? 'fr-FR' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="ff-floating-action ff-floating-action--right fixed bottom-6 z-[72] sm:bottom-6"
          aria-label="Open assistant"
        >
          <FaRobot size={20} />
        </button>
      ) : null}

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 z-[80] flex h-[min(42rem,calc(100vh-9rem))] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/92 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/92 sm:right-6"
          >
            <div className="ff-panel--dark rounded-none px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                    Fit Feast assistant
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">Nutrition concierge</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Bilingual help for meals, macros, planning, and support questions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
                  aria-label="Close assistant"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {translationOptions.map((option) => (
                  <button
                    key={option.value || 'auto'}
                    type="button"
                    onClick={() => setTranslationMode(option.value)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                      translationMode === option.value
                        ? 'bg-emerald-400/20 text-emerald-100'
                        : 'bg-white/10 text-slate-200 hover:bg-white/15'
                    }`}
                    title={option.helper}
                  >
                    <span className="inline-flex items-center gap-2">
                      <FaLanguage />
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center dark:border-white/10 dark:bg-white/5">
                  <p className="font-semibold text-slate-900 dark:text-white">Hello there</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Ask about meals, nutrition, checkout, allergies, or loyalty. Upload an image or
                    audio note when you need extra context.
                  </p>
                </div>
              ) : null}

              {messages.map((message, index) => {
                const isUser = message.role === 'user';

                return (
                  <div key={`${message.role}-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm leading-6 ${
                        isUser
                          ? 'bg-emerald-500 text-white shadow-[0_18px_38px_-24px_rgba(16,185,129,0.6)]'
                          : 'border border-slate-200 bg-slate-50/90 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>

                      {message.attachments?.image || message.attachments?.audio ? (
                        <div className={`mt-3 flex flex-wrap gap-2 text-xs ${isUser ? 'text-emerald-50/90' : 'text-slate-500 dark:text-slate-400'}`}>
                          {message.attachments.image ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/10 px-3 py-1">
                              <FiImage />
                              {message.attachments.image}
                            </span>
                          ) : null}
                          {message.attachments.audio ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/10 px-3 py-1">
                              <FiMic />
                              {message.attachments.audio}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      {!isUser ? (
                        <button
                          type="button"
                          onClick={() => speakText(message.content, message.language)}
                          className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
                        >
                          <FaVolumeUp />
                          Listen
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {loading ? (
                <div className="flex justify-start">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.1s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <div
              className="border-t border-slate-200/80 bg-white/90 px-4 py-4 dark:border-white/10 dark:bg-slate-950/90"
              onDrop={(event) => {
                event.preventDefault();
                const droppedFile = event.dataTransfer.files?.[0];
                if (!droppedFile) {
                  return;
                }

                if (droppedFile.type.startsWith('image/')) {
                  setImageFile(droppedFile);
                  return;
                }

                if (droppedFile.type.startsWith('audio/')) {
                  setAudioFile(droppedFile);
                }
              }}
              onDragOver={(event) => event.preventDefault()}
            >
              {(imageFile || audioFile) ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {imageFile ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                      <FiImage />
                      {imageFile.name}
                      <button type="button" onClick={() => setImageFile(null)} aria-label="Remove image">
                        <FiX />
                      </button>
                    </span>
                  ) : null}
                  {audioFile ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                      <FiMic />
                      {audioFile.name}
                      <button type="button" onClick={() => setAudioFile(null)} aria-label="Remove audio">
                        <FiX />
                      </button>
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>Auto reply language: {currentInputLanguage === 'fr' ? 'French' : 'English'}</span>
                <span className="inline-flex items-center gap-2">
                  <FiUploadCloud />
                  Drag in image or audio
                </span>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex flex-col gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                  />
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    onChange={(event) => setAudioFile(event.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="ff-icon-button h-[3.25rem] w-[3.25rem]"
                    aria-label="Upload image"
                  >
                    <FiImage />
                  </button>
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="ff-icon-button h-[3.25rem] w-[3.25rem]"
                    aria-label="Upload audio"
                  >
                    <FiMic />
                  </button>
                </div>

                <textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask about meals, orders, macros, or support..."
                  className="ff-textarea min-h-[3.25rem] flex-1 resize-none"
                />

                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={loading || (!inputValue.trim() && !imageFile && !audioFile)}
                  className="ff-button-primary h-[3.25rem] w-[3.25rem] rounded-[1.2rem] p-0 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Send message"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
