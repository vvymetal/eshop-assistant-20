// src/components/ChatInput/ChatInput.jsx
import React from 'react';
import { Input, Button, Tooltip } from 'antd';
import { SendOutlined, AudioOutlined } from '@ant-design/icons';
import { useChat } from '../../contexts/ChatContext';
import styles from './ChatInput.module.css';

const ChatInput = () => {
  const { 
    inputMessage, 
    setInputMessage, 
    sendMessage, 
    isLoading, 
    isListening, 
    handleVoiceInput 
  } = useChat();

  const handleSend = () => {
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.chatInput}>
      <Input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        disabled={isLoading}
      />
      <div className={styles.chatInputButtons}>
        <Tooltip title="Send message">
          <Button
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={isLoading}
          />
        </Tooltip>
        <Tooltip title={isListening ? "Listening..." : "Start voice input"}>
          <Button
            icon={<AudioOutlined />}
            onClick={handleVoiceInput}
            loading={isListening}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default React.memo(ChatInput);