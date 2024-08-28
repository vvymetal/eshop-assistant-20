import React from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, Select } from 'antd';
import Message from '../Message/Message';
import CartItem from '../CartItem/CartItem';
import ChatInput from '../ChatInput/ChatInput';
import CartHeader from '../CartHeader/CartHeader';
import CartSummary from '../CartSummary/CartSummary';
import { useChat } from '../../contexts/ChatContext';
import { useCart } from '../../contexts/CartContext';
import { useSettings } from '../../contexts/SettingsContext';
import styles from './ChatWidget.module.css';

const { Option } = Select;

const ChatDesktop = ({ customStyles }) => {
  const { 
    messages, 
    isLoading, 
    chatEndRef 
  } = useChat();

  const { 
    workingCart, 
    isCartMinimized, 
    handleCheckout 
  } = useCart();

  const { 
    showSettings, 
    openSettings, 
    closeSettings, 
    voices, 
    selectedVoice, 
    changeVoice 
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
      <div className={`${styles.cartColumn} ${isCartMinimized ? styles.minimized : ''}`}>
        <CartHeader onOpenSettings={openSettings} />
        {!isCartMinimized && (
          <>
            <div className={styles.cartItems}>
              {workingCart.map((item) => (
                <CartItem key={item.product_id} item={item} />
              ))}
            </div>
            <CartSummary />
            <Button 
              onClick={handleCheckout} 
              className={styles.checkoutButton}
            >
              Buy in e-shop
            </Button>
          </>
        )}
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
          value={selectedVoice ? selectedVoice.name : undefined}
          onChange={(value) => changeVoice(voices.find(v => v.name === value))}
        >
          {voices.map((voice) => (
            <Option key={voice.name} value={voice.name}>{voice.name}</Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
};

ChatDesktop.propTypes = {
  customStyles: PropTypes.object
};

export default ChatDesktop;