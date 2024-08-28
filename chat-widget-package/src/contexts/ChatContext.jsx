import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL } from '../config/constants';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children, apiEndpoint = API_BASE_URL }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);

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

  const fetchLatestMessages = useCallback(async () => {
    if (!chatId) {
      console.log('ChatId not initialized yet');
      return;
    }
    try {
      console.log('Fetching messages for chatId:', chatId);
      const response = await fetch(`${apiEndpoint}/chat/${chatId}/latest-messages`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Fetched messages:', data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching latest messages:', error);
      setMessages([]);
    }
  }, [apiEndpoint, chatId]);

  const sendMessage = useCallback(async () => {
    if (inputMessage.trim() !== '') {
      console.log('Odesílání zprávy:', inputMessage);
      setMessages(prevMessages => [...prevMessages, { role: 'user', content: inputMessage }]);
      setInputMessage('');
      setIsLoading(true);

      try {
        console.log('Volání API:', `${apiEndpoint}/chat/${chatId}`);
        const response = await fetch(`${apiEndpoint}/chat/${chatId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_query: inputMessage }),
        });

        console.log('API odpověď status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let accumulatedResponse = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          console.log('Přijatý chunk:', chunk);

          accumulatedResponse += chunk;
          const lines = accumulatedResponse.split('\n');
          accumulatedResponse = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonData = line.slice(5);
              try {
                const parsedData = JSON.parse(jsonData);
                if (parsedData.text?.value) {
                  setMessages(prevMessages => {
                    const lastMessage = prevMessages[prevMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'assistant') {
                      const updatedMessages = [...prevMessages];
                      updatedMessages[updatedMessages.length - 1] = {
                        ...lastMessage,
                        content: lastMessage.content + parsedData.text.value
                      };
                      return updatedMessages;
                    } else {
                      return [...prevMessages, { role: 'assistant', content: parsedData.text.value }];
                    }
                  });
                }
              } catch (error) {
                console.error('Chyba při parsování JSON:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Chyba při odesílání zprávy:', error);
        setMessages(prevMessages => [...prevMessages, { role: 'error', content: 'Došlo k chybě při komunikaci se serverem.' }]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [inputMessage, chatId, apiEndpoint]);

  const startListening = useCallback(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'cs-CZ';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
      };
      recognition.start();
      setIsListening(true);
      recognition.onend = () => setIsListening(false);
    } else {
      message.error('Speech recognition is not supported in your browser.');
    }
  }, []);

  return (
    <ChatContext.Provider value={{
      messages,
      setMessages,
      inputMessage,
      setInputMessage,
      isLoading,
      isListening,
      chatId,
      chatEndRef,
      fetchLatestMessages,
      sendMessage,
      startListening
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;