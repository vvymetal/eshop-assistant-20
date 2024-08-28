// src/components/ChatWidget/ChatWidget.jsx
import React from 'react';
import Message from '../Message/Message';
import ChatInput from '../ChatInput/ChatInput';
import CartColumn from '../CartColumn/CartColumn';
import { useChat } from '../../contexts/ChatContext';
import { useSettings } from '../../contexts/SettingsContext';
import styles from './ChatWidget.module.css';

const ChatWidget = ({ customStyles }) => {
  const { 
    messages, 
    isLoading, 
    chatEndRef 
  } = useChat();

  const { 
    openSettings
  } = useSettings();

  return (
    <div className={styles.chatWidget} style={customStyles}>
      <div className={styles.chatColumn}>
        <div className={styles.chatHeader}>Chat with Assistant</div>
        <div className={styles.chatMessages}>
          {messages.map((message, index) => (
            <Message key={index} content={message.content} role={message.role} />
          ))}
          <div ref={chatEndRef} />
        </div>
        <ChatInput />
      </div>
      <CartColumn onOpenSettings={openSettings} />
    </div>
  );
};

export default ChatWidget;