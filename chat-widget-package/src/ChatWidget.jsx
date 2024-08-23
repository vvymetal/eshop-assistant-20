import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, List, Card, Image, Modal } from 'antd';
import { ShoppingCartOutlined, SendOutlined } from '@ant-design/icons';

const ChatWidget = ({ apiEndpoint, onAddToCart, customStyles = {} }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workingCart, setWorkingCart] = useState([]);
  const [quizData, setQuizData] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Nová funkcionalita pro snadnou integraci
  useEffect(() => {
    console.log('ChatWidget initialized with endpoint:', apiEndpoint);
  }, [apiEndpoint]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: inputMessage }]);
    setInputMessage('');

    try {
      const response = await fetch(`${apiEndpoint}/${chat_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: inputMessage }),
      });

      if (response.body) {
        const reader = response.body.getReader();
        let partialResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          partialResponse += new TextDecoder().decode(value);
          const chunks = partialResponse.split('\n\n');
          
          for (let chunk of chunks) {
            if (chunk.startsWith('data: ')) {
              const data = JSON.parse(chunk.slice(6));
              handleStreamedResponse(data);
            }
          }

          partialResponse = chunks[chunks.length - 1];
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamedResponse = (data) => {
    if (data.type === 'text') {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === 'assistant') {
          return [...prev.slice(0, -1), { ...lastMessage, content: lastMessage.content + data.content }];
        } else {
          return [...prev, { role: 'assistant', content: data.content }];
        }
      });
    } else if (data.type === 'product') {
      setWorkingCart(prev => [...prev, data.product]);
    } else if (data.type === 'quiz') {
      setQuizData(data.quiz);
      setShowQuiz(true);
    }
  };

  const renderMessage = (message) => (
    <List.Item>
      <Card>
        <strong>{message.role === 'user' ? 'You:' : 'Assistant:'}</strong>
        <p>{message.content}</p>
      </Card>
    </List.Item>
  );

  const renderWorkingCart = () => (
      <Modal
        title="Working Cart"
        open={workingCart.length > 0}
        onOk={() => onAddToCart(workingCart)}
        onCancel={() => setWorkingCart([])}
      >
      <List
        dataSource={workingCart}
        renderItem={item => (
          <List.Item>
            <Card>
              <Image src={item.image} width={50} />
              <p>{item.name} - ${item.price}</p>
            </Card>
          </List.Item>
        )}
      />
    </Modal>
  );

  const renderQuiz = () => (
    <Modal
      title={quizData?.title}
      open={showQuiz}
      onOk={() => setShowQuiz(false)}
      onCancel={() => setShowQuiz(false)}
    >
      {quizData?.questions.map((question, index) => (
        <div key={index}>
          <p>{question.text}</p>
          {question.options.map((option, optionIndex) => (
            <Button key={optionIndex} onClick={() => handleQuizAnswer(index, optionIndex)}>
              {option}
            </Button>
          ))}
        </div>
      ))}
    </Modal>
  );

  const handleQuizAnswer = (questionIndex, answerIndex) => {
    // Implementace logiky pro zpracování odpovědí na kvíz
    console.log(`Question ${questionIndex}, Answer ${answerIndex}`);
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
      {renderWorkingCart()}
      {renderQuiz()}
    </div>
  );
};

export default ChatWidget;