import React from 'react';
import { Button, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, SettingOutlined } from '@ant-design/icons';
import { useCart } from '../../contexts/CartContext';
import './CartHeader.module.css';

const CartHeader = ({ onOpenSettings }) => {
  const { isCartMinimized, toggleCartMinimize, cartSummary } = useCart();

  return (
    <div className="cart-header">
      Working Cart
      <Tooltip title={isCartMinimized ? "Expand cart" : "Minimize cart"}>
        <Button 
          className="minimize-button" 
          icon={isCartMinimized ? <RightOutlined /> : <LeftOutlined />} 
          onClick={toggleCartMinimize} 
          aria-label={isCartMinimized ? "Expand cart" : "Minimize cart"}
        />
      </Tooltip>
      <Tooltip title="Open settings">
        <Button 
          className="settings-button" 
          icon={<SettingOutlined />} 
          onClick={onOpenSettings} 
          aria-label="Open settings" 
        />
      </Tooltip>
    </div>
  );
};

export default CartHeader;