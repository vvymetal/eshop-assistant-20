// src/contexts/SettingsContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    // Načtení dostupných hlasů
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices.filter(voice => voice.lang.startsWith('cs') || voice.lang.startsWith('en')));
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  const changeVoice = useCallback((voice) => {
    setSelectedVoice(voice);
    // Zde můžete přidat logiku pro uložení preferovaného hlasu do localStorage
  }, []);

  const speakText = useCallback((text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  }, [selectedVoice]);

  return (
    <SettingsContext.Provider value={{
      showSettings,
      openSettings,
      closeSettings,
      voices,
      selectedVoice,
      changeVoice,
      speakText
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;