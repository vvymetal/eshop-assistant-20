import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Button, Modal, Select } from 'antd';
import Message from '../Message/Message';
import CartItem from '../CartItem/CartItem';
import ChatInput from '../ChatInput/ChatInput';
import CartHeader from '../CartHeader/CartHeader';
import CartSummary from '../CartSummary/CartSummary';
import { useChat } from '../../contexts/ChatContext';
import { useCart } from '../../contexts/CartContext';
import { useSettings } from '../../contexts/SettingsContext';
import styles from './ChatWidget.module.css';

const { TabPane } = Tabs;
const { Option } = Select;

const ChatMobile = ({ customStyles, apiEndpoint }) => {
  const [activeTab, setActiveTab] = useState('chat');
  
  const { 
    messages, 
    isLoading, 
    chatEndRef 
  } = useChat();

  const { 
    workingCart, 
    cartSummary,
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
    <div className={styles.chatWidgetMobile} style={customStyles}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Chat" key="chat">
          <div className={styles.chatColumn}>
            <div className={styles.chatMessages}>
              {messages.map((message, index) => (
                <Message key={index} content={message.content} role={message.role} />
              ))}
              <div ref={chatEndRef} />
            </div>
            <ChatInput />
          </div>
        </TabPane>
        <TabPane tab={`Cart (${cartSummary.totalItems})`} key="cart">
          <div className={styles.cartColumn}>
            <CartHeader onOpenSettings={openSettings} />
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
              Buy in e-shop ({cartSummary.totalItems} items)
            </Button>
          </div>
        </TabPane>
      </Tabs>
      
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

ChatMobile.propTypes = {
  customStyles: PropTypes.object,
  apiEndpoint: PropTypes.string.isRequired
};

export default ChatMobile;