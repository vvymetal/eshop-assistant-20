import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, List, Card, Image, Modal, Select } from 'antd';
import { ShoppingCartOutlined, SendOutlined, AudioOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';

const { Option } = Select;

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
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setChatId(uuidv4());
    console.log('ChatWidget initialized with endpoint:', apiEndpoint);
    console.log('Generated chatId:', chatId);
    
    // Inicializace hlasů pro text-to-speech
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

  const updateWorkingCart = (cartAction) => {
    console.log('Vstupní cartAction:', cartAction);
    
    let parsedAction;
    try {
      parsedAction = typeof cartAction === 'string' ? JSON.parse(cartAction) : cartAction;
    } catch (error) {
      console.error('Chyba při parsování cartAction:', error);
      return; // Ukončíme funkci, pokud nemůžeme parsovat data
    }
  
    console.log('Zpracování akce košíku:', parsedAction);
  
    if (!parsedAction || typeof parsedAction !== 'object') {
      console.error('Neplatná struktura cartAction');
      return;
    }
  
    const { status, product_id, name, price, quantity, message } = parsedAction;
  
    setWorkingCart(prevCart => {
      let updatedCart = [...prevCart];
  
      switch (status) {
        case 'removed':
          updatedCart = updatedCart.filter(item => item.product_id !== product_id);
          console.log(message || `Položka ${product_id} odebrána z košíku`);
          break;
        
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
          console.log(message || `Položka ${product_id} přidána/aktualizována v košíku`);
          break;
        
        case 'cleared':
          updatedCart = [];
          console.log('Košík byl vyčištěn');
          break;
        
        default:
          console.warn(`Neznámá akce košíku: ${status}`);
          return prevCart; // Vrátíme původní stav košíku při neznámé akci
      }
  
      console.log('Nový stav košíku:', updatedCart);
      return updatedCart;
    });
  };

  const sendMessage = async () => {
    if (inputMessage.trim() !== '') {
      console.log('Odesílání zprávy:', inputMessage);
      setMessages(prevMessages => [...prevMessages, { role: 'user', content: inputMessage }]);
      setInputMessage('');
      setIsLoading(true);
  
      try {
        console.log('Volání API:', `${apiEndpoint}/${chatId}`);
        const response = await retryFetch(`${apiEndpoint}/${chatId}`, {
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
          accumulatedResponse = lines.pop(); // Poslední (možná neúplný) chunk
          
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
                  updateWorkingCart(parsedData.cart_action);
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
  };

// Přidejte tuto funkci do komponenty
const retryFetch = async (url, options, retries = 3) => {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return retryFetch(url, options, retries - 1);
    }
    throw err;
  }
};


  const handleStreamedResponse = (data) => {
    console.log('Zpracování streamovaných dat:', data);
    // Tato funkce může být použita pro další zpracování streamovaných dat,
    // pokud je potřeba další logika kromě přímého zobrazení
  };

  const renderMessage = (message) => (
    <List.Item>
      <Card style={{ width: '100%', backgroundColor: message.role === 'user' ? '#e6f7ff' : '#f0f0f0' }}>
        <strong>{message.role === 'user' ? 'You:' : 'Assistant:'}</strong>
        <ReactMarkdown>{message.content || ''}</ReactMarkdown>
      </Card>
    </List.Item>
  );

  const renderWorkingCart = () => (
    <Modal
      title="Working Cart"
      open={showCart}
      onOk={() => {
        onAddToCart(workingCart);
        setShowCart(false);
      }}
      onCancel={() => setShowCart(false)}
    >
      <List
        dataSource={workingCart}
        renderItem={item => (
          <List.Item>
            <Card>
              {item.image && <Image src={item.image} width={50} />}
              <p>{item.name || 'Unnamed product'} - {item.price ? `$${item.price}` : 'N/A'}</p>
              <p>Quantity: {item.quantity}</p>
            </Card>
          </List.Item>
        )}
      />
    </Modal>
  );

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
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
    }
  };

  return (
    <div className="chat-widget" style={{
      ...customStyles,
      width: '600px',
      backgroundColor: '#f0f0f0',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    }}>
      <List
        className="message-list"
        dataSource={messages}
        renderItem={renderMessage}
        style={{ maxHeight: '400px', overflowY: 'auto' }}
      />
      <div ref={chatEndRef} />
      <div className="chat-input" style={{ marginTop: '20px' }}>
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onPressEnter={sendMessage}
          placeholder="Type a message..."
          disabled={isLoading}
          style={{ marginBottom: '10px' }}
        />
        <Button onClick={sendMessage} icon={<SendOutlined />} loading={isLoading} style={{ marginRight: '10px' }}>
          Send
        </Button>
        <Button onClick={() => setShowCart(true)} icon={<ShoppingCartOutlined />} style={{ marginRight: '10px' }}>
          Cart ({workingCart.length})
        </Button>
        <Button onClick={startListening} icon={<AudioOutlined />} loading={isListening}>
          {isListening ? 'Listening...' : 'Speak'}
        </Button>
      </div>
      <div style={{ marginTop: '10px' }}>
        <Select
          style={{ width: 200 }}
          placeholder="Select a voice"
          onChange={(value) => setSelectedVoice(voices.find(v => v.name === value))}
        >
          {voices.map((voice) => (
            <Option key={voice.name} value={voice.name}>{voice.name}</Option>
          ))}
        </Select>
        <Button onClick={() => speakText(messages[messages.length - 1]?.content)} style={{ marginLeft: '10px' }}>
          Speak Last Message
        </Button>
      </div>
      {renderWorkingCart()}
      {showQuiz && renderQuiz()}
    </div>
  );
};

export default ChatWidget;