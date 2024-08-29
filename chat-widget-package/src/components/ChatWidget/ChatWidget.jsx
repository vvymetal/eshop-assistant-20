// src/components/ChatWidget/ChatWidget.jsx
import React from 'react';
import ChatDesktop from './ChatDesktop';
import ChatMobile from './ChatMobile';
import { useChat } from '../../contexts/ChatContext';
import { useSettings } from '../../contexts/SettingsContext';
import useResponsive from '../../hooks/useResponsive';
import styles from './ChatWidget.module.css';

const ChatWidget = ({ customStyles }) => {
  const { isMobile } = useResponsive();
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
      {isMobile ? (
        <ChatMobile 
          messages={messages}
          isLoading={isLoading}
          chatEndRef={chatEndRef}
          onOpenSettings={openSettings}
          customStyles={customStyles}
        />
      ) : (
        <ChatDesktop 
          messages={messages}
          isLoading={isLoading}
          chatEndRef={chatEndRef}
          onOpenSettings={openSettings}
          customStyles={customStyles}
        />
      )}
    </div>
  );
};

export default ChatWidget;