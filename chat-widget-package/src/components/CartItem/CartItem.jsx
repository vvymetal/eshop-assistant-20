import React from 'react';
import { Button } from 'antd';
import { PlusOutlined, MinusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCart } from '../../contexts/CartContext';
import './CartItem.module.css';

const CartItem = ({ item }) => {
  const { updateWorkingCart } = useCart();

  const handleUpdateQuantity = (newQuantity) => {
    updateWorkingCart({
      status: 'updated',
      product_id: item.product_id,
      quantity: newQuantity
    });
  };

  const handleRemove = () => {
    updateWorkingCart({
      status: 'removed',
      product_id: item.product_id
    });
  };

  return (
    <div className="cart-item" role="listitem">
      <div className="item-details">
        <p>{item.name || 'Unnamed product'} - {item.price ? `$${item.price}` : 'N/A'}</p>
        <p>{item.quantity}x ${(item.price * item.quantity).toFixed(2)}</p>
      </div>
      <div className="item-actions">
        <Button 
          icon={<MinusOutlined />} 
          onClick={() => handleUpdateQuantity(item.quantity - 1)} 
          aria-label={`Decrease quantity of ${item.name}`} 
        />
        <Button 
          icon={<PlusOutlined />} 
          onClick={() => handleUpdateQuantity(item.quantity + 1)} 
          aria-label={`Increase quantity of ${item.name}`} 
        />
        <Button 
          icon={<DeleteOutlined />} 
          onClick={handleRemove} 
          aria-label={`Remove ${item.name} from cart`} 
        />
      </div>
    </div>
  );
};

export default CartItem;