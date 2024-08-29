// src/contexts/ChatIdContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ChatIdContext = createContext();

export const useChatId = () => useContext(ChatIdContext);

export const ChatIdProvider = ({ children }) => {
  const [chatId, setChatId] = useState(null);

  useEffect(() => {
    const initializeChatId = () => {
      try {
        let storedChatId = localStorage.getItem('chatId') || sessionStorage.getItem('chatId');
        if (storedChatId) {
          console.log('Retrieved existing chatId:', storedChatId);
          setChatId(storedChatId);
        } else {
          const newChatId = uuidv4();
          console.log('Created new chatId:', newChatId);
          try {
            localStorage.setItem('chatId', newChatId);
          } catch (e) {
            sessionStorage.setItem('chatId', newChatId);
          }
          setChatId(newChatId);
        }
      } catch (error) {
        console.error('Error accessing storage:', error);
        const fallbackChatId = uuidv4();
        console.log('Using fallback chatId:', fallbackChatId);
        setChatId(fallbackChatId);
      }
    };

    initializeChatId();
  }, []);

  return (
    <ChatIdContext.Provider value={chatId}>
      {children}
    </ChatIdContext.Provider>
  );
};