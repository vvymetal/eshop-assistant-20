import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Button, Input, List, Card, Image, Modal, Select, message, Tooltip } from 'antd';
import { ShoppingCartOutlined, SendOutlined, AudioOutlined, PlusOutlined, MinusOutlined, DeleteOutlined, SettingOutlined, RightOutlined, LeftOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import ErrorBoundary from './ErrorBoundary';

import './ChatWidget.css';

const { Option } = Select;

const Quiz = React.lazy(() => import('./Quiz'));

const Message = React.memo(({ content, role }) => (
  <div className={`message ${role}`} role="listitem">
    <ReactMarkdown>{content || ''}</ReactMarkdown>
  </div>
));

const CartItem = React.memo(({ item, onUpdateQuantity, onRemove }) => (
  <div className="cart-item" role="listitem">
    <div className="item-details">
      <p>{item.name || 'Unnamed product'} - {item.price ? `$${item.price}` : 'N/A'}</p>
      <p>{item.quantity}x ${(item.price * item.quantity).toFixed(2)}</p>
    </div>
    <div className="item-actions">
      <Button icon={<MinusOutlined />} onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)} aria-label={`Decrease quantity of ${item.name}`} />
      <Button icon={<PlusOutlined />} onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)} aria-label={`Increase quantity of ${item.name}`} />
      <Button icon={<DeleteOutlined />} onClick={() => onRemove(item.product_id)} aria-label={`Remove ${item.name} from cart`} />
    </div>
  </div>
));

const ChatWidget = ({ apiEndpoint, onAddToCart, customStyles = {} }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workingCart, setWorkingCart] = useState([]);
  const [quizData, setQuizData] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [isCartMinimized, setIsCartMinimized] = useState(false);
  const [cartSummary, setCartSummary] = useState({ totalItems: 0, totalPrice: 0, discount: 0, finalPrice: 0, saved: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    console.log('ChatWidget initialized with endpoint:', apiEndpoint);

    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices.filter(voice => voice.lang.startsWith('cs') || voice.lang.startsWith('en')));
    };
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }, [apiEndpoint]);

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

  const fetchCart = useCallback(async () => {
    if (!chatId) {
      console.log('ChatId not initialized yet');
      return;
    }
    setIsCartLoading(true);
    try {
      console.log('Fetching cart for chatId:', chatId);
      const response = await fetch(`${apiEndpoint}/cart/${chatId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const cartData = await response.json();
      console.log('Fetched cart data:', cartData);
      if (cartData && cartData.data) {
        const cartItems = Array.isArray(cartData.data) ? cartData.data : [cartData.data];
        setWorkingCart(cartItems);
      } else {
        console.warn('Received cart data is not in expected format:', cartData);
        setWorkingCart([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setWorkingCart([]);
    } finally {
      setIsCartLoading(false);
    }
  }, [apiEndpoint, chatId]);

  useEffect(() => {
    if (chatId) {
      Promise.all([fetchLatestMessages(), fetchCart()])
        .finally(() => setIsInitializing(false));
    }
  }, [chatId, fetchLatestMessages, fetchCart]);

  useEffect(() => {
    console.log('Working cart updated:', workingCart);
    updateCartSummary();
  }, [workingCart]);

  const updateCartSummary = useCallback(() => {
    const totalItems = workingCart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = workingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Assume discount logic here - this should be implemented based on your business rules
    const discount = 0; // For now, we're not applying any discount
    const finalPrice = totalPrice - discount;
    const saved = totalPrice - finalPrice;

    setCartSummary({ totalItems, totalPrice, discount, finalPrice, saved });
  }, [workingCart]);

  const updateWorkingCart = useCallback((cartAction) => {
    console.log('Updating cart with action:', cartAction);

    let parsedAction;
    try {
      parsedAction = typeof cartAction === 'string' ? JSON.parse(cartAction) : cartAction;
    } catch (error) {
      console.error('Chyba při parsování cartAction:', error);
      return;
    }

    console.log('Zpracování akce košíku:', parsedAction);

    if (!parsedAction || typeof parsedAction !== 'object') {
      console.error('Neplatná struktura cartAction');
      return;
    }

    const { status, product_id, name, price, quantity } = parsedAction;

    setWorkingCart(prevCart => {
      const updatedCart = [...prevCart];

      switch (status) {
        case 'removed':
          return updatedCart.filter(item => item.product_id !== product_id);
        case 'added':
        case 'updated':
          const existingItemIndex = updatedCart.findIndex(item => item.product_id === product_id);
          if (existingItemIndex !== -1) {
            updatedCart[existingItemIndex] = {
              ...updatedCart[existingItemIndex],
              quantity: quantity ?? updatedCart[existingItemIndex].quantity + 1,
              name: name || updatedCart[existingItemIndex].name,
              price: price ?? updatedCart[existingItemIndex].price
            };
          } else {
            updatedCart.push({
              product_id,
              name: name || 'Unnamed product',
              price: price ?? 'N/A',
              quantity: quantity ?? 1
            });
          }
          return updatedCart;
        case 'cleared':
          return [];
        default:
          console.warn(`Neznámá akce košíku: ${status}`);
          return prevCart;
      }
    });

    // Zobrazení notifikace o změně košíku
    switch (status) {
      case 'removed':
        message.success(`Položka ${product_id} odebrána z košíku`);
        break;
      case 'added':
      case 'updated':
        message.success(`Položka ${name || product_id} přidána/aktualizována v košíku`);
        break;
      case 'cleared':
        message.success('Košík byl vyčištěn');
        break;
    }

    // Synchronizace s backendem
    fetch(`${apiEndpoint}/cart/${chatId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedAction),
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to update cart on server');
      return response.json();
    })
    .then(updatedCart => {
      console.log('Cart updated on server:', updatedCart);
      if (updatedCart && updatedCart.data) {
        const cartItems = Array.isArray(updatedCart.data) ? updatedCart.data : [updatedCart.data];
        setWorkingCart(cartItems);
      } else {
        console.warn('Received updated cart data is not in expected format:', updatedCart);
      }
    })
    .catch(error => console.error('Error updating cart on server:', error));

    console.log('Aktualizace košíku dokončena');
  }, [chatId, apiEndpoint]);

  const sendMessage = useCallback(async () => {
    if (inputMessage.trim() !== '') {
      console.log('Odesílání zprávy:', inputMessage);
      setMessages(prevMessages => [...prevMessages, { role: 'user', content: inputMessage }]);
      setInputMessage('');
      setIsLoading(true);

      try {
        console.log('Volání API:', `${apiEndpoint}/chat/${chatId}`);
        const response = await retryFetch(`${apiEndpoint}/chat/${chatId}`, {
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
         // console.log('Přijatý chunk:', chunk);

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
                if (parsedData.cart_action) {
                  try {
                    const cartAction = typeof parsedData.cart_action === 'string' 
                      ? JSON.parse(parsedData.cart_action) 
                      : parsedData.cart_action;
                    console.log('Processed cart_action:', cartAction);  
                    updateWorkingCart(cartAction);
                  } catch (error) {
                    console.error('Chyba při zpracování cart_action:', error);
                  }
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
  }, [inputMessage, chatId, apiEndpoint, updateWorkingCart]);

  const retryFetch = useCallback(async (url, options, retries = 3) => {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return retryFetch(url, options, retries - 1);
      }
      throw err;
    }
  }, []);

  const updateItemQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity > 0) {updateWorkingCart({ status: 'updated', product_id: productId, quantity: newQuantity });
  } else {
    removeFromCart(productId);
  }
}, [updateWorkingCart]);

const removeFromCart = useCallback((productId) => {
  updateWorkingCart({ status: 'removed', product_id: productId });
}, [updateWorkingCart]);

const handleCheckout = useCallback(() => {
  if (workingCart.length === 0) {
    message.warning('Košík je prázdný');
    return;
  }
  onAddToCart(workingCart);
  message.success('Položky byly úspěšně přidány do hlavního košíku!');
}, [workingCart, onAddToCart]);

const speakText = useCallback((text) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    window.speechSynthesis.speak(utterance);
  }
}, [selectedVoice]);

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

const memoizedVoiceOptions = useMemo(() => 
  voices.map((voice) => (
    <Option key={voice.name} value={voice.name}>{voice.name}</Option>
  ))
, [voices]);

const memoizedMessages = useMemo(() => 
  messages && messages.length ? messages.map((message, index) => (
    <Message key={index} content={message.content} role={message.role} />
  )) : []
, [messages]);

const memoizedCartItems = useMemo(() => 
  Array.isArray(workingCart) && workingCart.length 
    ? workingCart.map((item) => (
        <CartItem 
          key={item.product_id} 
          item={item} 
          onUpdateQuantity={updateItemQuantity}
          onRemove={removeFromCart}
        />
      )) 
    : <p>Váš košík je prázdný.</p>
, [workingCart, updateItemQuantity, removeFromCart]);

const toggleCartMinimize = () => {
  setIsCartMinimized(!isCartMinimized);
};

const addCommonResponse = (response) => {
  setInputMessage(response);
  sendMessage();
};

const openSettings = () => {
  setShowSettings(true);
};

const closeSettings = () => {
  setShowSettings(false);
};

if (isInitializing) {
  return <div>Initializing chat...</div>;
}

return (
  <ErrorBoundary>
    <div className="chat-widget" style={customStyles}>
      <div className="chat-column">
        <div className="chat-header">Chat with Assistant</div>
        <div className="chat-messages" role="list">
          {memoizedMessages}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input">
          <div className="input-area">
            <Input
              className="input-field"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onPressEnter={sendMessage}
              placeholder="Type a message..."
              disabled={isLoading}
              aria-label="Message input"
            />
            <Tooltip title="Send message">
              <Button className="send-button" onClick={sendMessage} icon={<SendOutlined />} loading={isLoading} aria-label="Send message" />
            </Tooltip>
            <Tooltip title={isListening ? "Listening..." : "Start voice input"}>
              <Button className="speech-button" onClick={startListening} icon={<AudioOutlined />} loading={isListening} aria-label="Start voice input" />
            </Tooltip>
          </div>
          <div className="common-responses">
            <Button onClick={() => addCommonResponse("Yes, add to cart")}>Yes, add to cart</Button>
            <Button onClick={() => addCommonResponse("Start new conversation")}>Start new conversation</Button>
          </div>
        </div>
      </div>
      <div className={`cart-column ${isCartMinimized ? 'minimized' : ''}`}>
        <div className="cart-header">
          Working Cart
          <Tooltip title={isCartMinimized ? "Expand cart" : "Minimize cart"}>
            <Button 
              className="minimize-button" 
              icon={isCartMinimized ? <LeftOutlined /> : <RightOutlined />} 
              onClick={toggleCartMinimize} 
              aria-label={isCartMinimized ? "Expand cart" : "Minimize cart"}
            />
          </Tooltip>
          <Tooltip title="Open settings">
            <Button className="settings-button" icon={<SettingOutlined />} onClick={openSettings} aria-label="Open settings" />
          </Tooltip>
        </div>
        {!isCartMinimized && (
          <div className="cart-items" role="list">
            {isCartLoading ? (
              <p>Loading cart...</p>
            ) : (
              memoizedCartItems
            )}
          </div>
        )}
        <div className="cart-summary">
          <p>Items: {cartSummary.totalItems}</p>
          <p>Total: ${cartSummary.totalPrice.toFixed(2)}</p>
          <p>Discount: ${cartSummary.discount.toFixed(2)}</p>
          <p>Final Price: ${cartSummary.finalPrice.toFixed(2)}</p>
          <p>You save: ${cartSummary.saved.toFixed(2)}</p>
        </div>
        <Button className="checkout-button" onClick={handleCheckout} aria-label="Buy in e-shop">
          Buy in e-shop ({cartSummary.totalItems} items)
        </Button>
      </div>
      <Modal
        title="Settings"
        visible={showSettings}
        onCancel={closeSettings}
        footer={null}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Select a voice"
          onChange={(value) => setSelectedVoice(voices.find(v => v.name === value))}
          aria-label="Select voice for text-to-speech"
        >
          {memoizedVoiceOptions}
        </Select>
      </Modal>
      <Suspense fallback={<div>Loading quiz...</div>}>
        {showQuiz && <Quiz quizData={quizData} />}
      </Suspense>
    </div>
  </ErrorBoundary>
);
};

export default React.memo(ChatWidget);