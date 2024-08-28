// src/components/ChatWidget/useChatWidget.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { fetchLatestMessages, fetchCart, sendMessage as apiSendMessage } from '../../utils/api/chat';
import { updateCart } from '../../utils/api/cart';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';

const useChatWidget = (apiEndpoint, onAddToCart) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workingCart, setWorkingCart] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [cartSummary, setCartSummary] = useState({ totalItems: 0, totalPrice: 0, discount: 0, finalPrice: 0, saved: 0 });
  const [isCartMinimized, setIsCartMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const chatEndRef = useRef(null);

  const { isListening, startListening } = useSpeechRecognition();

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

  useEffect(() => {
    if (chatId) {
      Promise.all([fetchLatestMessages(apiEndpoint, chatId), fetchCart(apiEndpoint, chatId)])
        .then(([messagesData, cartData]) => {
          setMessages(messagesData.messages || []);
          setWorkingCart(Array.isArray(cartData.data) ? cartData.data : [cartData.data]);
        })
        .catch(error => {
          console.error('Error fetching initial data:', error);
          message.error('Failed to load initial data');
        })
        .finally(() => {
          setIsInitializing(false);
          setIsCartLoading(false);
        });
    }
  }, [chatId, apiEndpoint]);

  useEffect(() => {
    updateCartSummary();
  }, [workingCart]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateCartSummary = useCallback(() => {
    const totalItems = workingCart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = workingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = 0; // Implement discount logic here if needed
    const finalPrice = totalPrice - discount;
    const saved = totalPrice - finalPrice;

    setCartSummary({ totalItems, totalPrice, discount, finalPrice, saved });
  }, [workingCart]);

  const sendMessage = useCallback(async () => {
    if (inputMessage.trim() !== '') {
      setMessages(prevMessages => [...prevMessages, { role: 'user', content: inputMessage }]);
      setInputMessage('');
      setIsLoading(true);

      try {
        const response = await apiSendMessage(apiEndpoint, chatId, inputMessage);
        let accumulatedResponse = '';
        for await (const chunk of response) {
          accumulatedResponse += chunk;
          try {
            const parsedData = JSON.parse(accumulatedResponse);
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
            if (parsedData.cart_action) {
              updateWorkingCart(parsedData.cart_action);
            }
            accumulatedResponse = '';
          } catch (error) {
            // Incomplete JSON, continue accumulating
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prevMessages => [...prevMessages, { role: 'error', content: 'An error occurred while communicating with the server.' }]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [inputMessage, chatId, apiEndpoint]);

  const updateWorkingCart = useCallback(async (cartAction) => {
    try {
      const updatedCart = await updateCart(apiEndpoint, chatId, cartAction);
      setWorkingCart(Array.isArray(updatedCart.data) ? updatedCart.data : [updatedCart.data]);
      message.success(`Cart updated: ${cartAction.status}`);
    } catch (error) {
      console.error('Error updating cart:', error);
      message.error('Failed to update cart');
    }
  }, [apiEndpoint, chatId]);

  const handleCheckout = useCallback(() => {
    if (workingCart.length === 0) {
      message.warning('Cart is empty');
      return;
    }
    onAddToCart(workingCart);
    message.success('Items were successfully added to the main cart!');
  }, [workingCart, onAddToCart]);

  const handleVoiceInput = useCallback(async () => {
    const transcript = await startListening();
    if (transcript) {
      setInputMessage(prevMessage => prevMessage + ' ' + transcript);
    }
  }, [startListening]);

  const toggleCartMinimize = useCallback(() => {
    setIsCartMinimized(prev => !prev);
  }, []);

  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  return {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isLoading,
    workingCart,
    chatId,
    isInitializing,
    isCartLoading,
    cartSummary,
    isCartMinimized,
    showSettings,
    chatEndRef,
    isListening,
    sendMessage,
    updateWorkingCart,
    handleCheckout,
    handleVoiceInput,
    toggleCartMinimize,
    openSettings,
    closeSettings,
  };
};

export default useChatWidget;