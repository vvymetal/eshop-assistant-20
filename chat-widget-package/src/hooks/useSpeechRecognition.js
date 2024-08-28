// src/hooks/useSpeechRecognition.js
import { useState, useCallback } from 'react';

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'cs-CZ';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        return transcript;
      };
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      console.error('Speech recognition is not supported in your browser.');
    }
  }, []);

  return { isListening, startListening };
};

export default useSpeechRecognition;