import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, List, Card, Image, Modal } from 'antd';
import { ShoppingCartOutlined, SendOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';


const ChatWidget = ({ apiEndpoint, onAddToCart, customStyles = {} }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workingCart, setWorkingCart] = useState([]);
  const [quizData, setQuizData] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [chatId, setChatId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const newChatId = uuidv4();
    setChatId(newChatId);
    console.log('ChatWidget initialized with endpoint:', apiEndpoint);
    console.log('New chat ID generated:', newChatId);
  }, [apiEndpoint]);

  const sendMessage = async () => {
    console.log('Attempting to send message. Input:', inputMessage, 'Chat ID:', chatId);
    if (!inputMessage.trim() || !chatId) {
      console.log('Message not sent: empty input or missing chat ID');
      return;
    }

    setIsLoading(true);
    setMessages(prev => {
      console.log('Adding user message to state:', inputMessage);
      return [...prev, { role: 'user', content: inputMessage }];
    });
    setInputMessage('');

    try {
      console.log(`Sending POST request to ${apiEndpoint}/${chatId}`);
      const response = await fetch(`${apiEndpoint}/${chatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: inputMessage }),
      });
      console.log('Response received:', response);

      if (response.body) {
        const reader = response.body.getReader();
        let partialResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Stream complete');
            break;
          }

          const chunk = new TextDecoder().decode(value);
          console.log('Received chunk:', chunk);
          partialResponse += chunk;
          const chunks = partialResponse.split('\n\n');
          
          for (let i = 0; i < chunks.length - 1; i++) {
            if (chunks[i].startsWith('data: ')) {
              try {
                const data = JSON.parse(chunks[i].slice(6));
                console.log('Parsed data:', data);
                handleStreamedResponse(data);
              } catch (error) {
                console.error('Error parsing chunk:', error);
              }
            }
          }

          partialResponse = chunks[chunks.length - 1];
        }
      } else {
        console.log('Response body is null');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      console.log('Message sending process completed');
    }
  };

  const handleStreamedResponse = (data) => {
    console.log('Handling streamed response:', data);
    if (data.type === 'text') {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          console.log('Updating existing assistant message');
          return [...prev.slice(0, -1), { ...lastMessage, content: lastMessage.content + (data.text?.value || '') }];
        } else {
          console.log('Adding new assistant message');
          return [...prev, { role: 'assistant', content: data.text?.value || '' }];
        }
      });
    } else if (data.type === 'product') {
      console.log('Adding product to working cart:', data.product);
      setWorkingCart(prev => [...prev, data.product]);
    } else if (data.type === 'quiz') {
      console.log('Setting quiz data:', data.quiz);
      setQuizData(data.quiz);
      setShowQuiz(true);
    } else {
      console.log('Unknown data type received:', data.type);
    }
  };

  const renderMessage = (message) => (
    <List.Item>
      <Card style={{ width: '100%' }}>
        <strong>{message.role === 'user' ? 'You:' : 'Assistant:'}</strong>
        <ReactMarkdown>{message.content || ''}</ReactMarkdown>
      </Card>
    </List.Item>
  );

  const renderWorkingCart = () => (
    <Modal
      title="Working Cart"
      open={workingCart.length > 0}
      onOk={() => {
        console.log('Adding items to cart:', workingCart);
        onAddToCart(workingCart);
      }}
      onCancel={() => {
        console.log('Clearing working cart');
        setWorkingCart([]);
      }}
    >
      <List
        dataSource={workingCart}
        renderItem={item => (
          <List.Item>
            <Card>
              {item.image && <Image src={item.image} width={50} />}
              <p>{item.name || 'Unnamed product'} - ${item.price || 'N/A'}</p>
            </Card>
          </List.Item>
        )}
      />
    </Modal>
  );

  const renderQuiz = () => (
    <Modal
      title={quizData?.title || 'Quiz'}
      open={showQuiz}
      onOk={() => {
        console.log('Closing quiz');
        setShowQuiz(false);
      }}
      onCancel={() => {
        console.log('Cancelling quiz');
        setShowQuiz(false);
      }}
    >
      {quizData?.questions?.map((question, index) => (
        <div key={index}>
          <p>{question.text || ''}</p>
          {question.options?.map((option, optionIndex) => (
            <Button key={optionIndex} onClick={() => handleQuizAnswer(index, optionIndex)}>
              {option || ''}
            </Button>
          ))}
        </div>
      )) || <p>No questions available</p>}
    </Modal>
  );

  const handleQuizAnswer = (questionIndex, answerIndex) => {
    console.log(`Quiz answer selected: Question ${questionIndex}, Answer ${answerIndex}`);
    // Implementace logiky pro zpracování odpovědí na kvíz
  };

  return (
    <div className="chat-widget" style={customStyles}>
      <List
        className="message-list"
        dataSource={messages}
        renderItem={renderMessage}
      />
      <div ref={chatEndRef} />
      <div className="chat-input">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onPressEnter={sendMessage}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <Button onClick={sendMessage} icon={<SendOutlined />} loading={isLoading}>
          Send
        </Button>
        <Button onClick={() => setWorkingCart([])} icon={<ShoppingCartOutlined />}>
          Cart ({workingCart.length})
        </Button>
      </div>
      {workingCart.length > 0 && renderWorkingCart()}
      {showQuiz && renderQuiz()}
    </div>
  );
};

export default ChatWidget;