import React from 'react';
import { Button } from 'antd';
import { PlusOutlined, MinusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCart } from '../../contexts/CartContext';
import styles from './CartItem.module.css';

const CartItem = ({ item }) => {
  const { updateWorkingCart } = useCart();

  console.log('Rendering CartItem:', item);  // Přidáno pro debugování

  const handleUpdateQuantity = (newQuantity) => {
    console.log('Updating quantity:', { productId: item.product_id, newQuantity });  // Přidáno pro debugování
    updateWorkingCart({
      status: 'updated',
      product_id: item.product_id,
      name: item.name,
      price: item.price,
      quantity: newQuantity
    });
  };

  const handleRemove = () => {
    console.log('Removing item:', item.product_id);  // Přidáno pro debugování
    updateWorkingCart({
      status: 'removed',
      product_id: item.product_id
    });
  };

  return (
    <div className={styles.cartItem} role="listitem">
      <div className={styles.itemDetails}>
        <p>{item.name || 'Unnamed product'} - {item.price !== undefined && item.price !== null ? `$${item.price}` : 'N/A'}</p>
        <p>{item.quantity}x {item.price !== undefined && item.price !== null ? `$${(item.price * item.quantity).toFixed(2)}` : 'N/A'}</p>
      </div>
      <div className={styles.itemActions}>
        <Button 
          icon={<MinusOutlined />} 
          onClick={() => handleUpdateQuantity(item.quantity - 1)} 
          disabled={item.quantity <= 1}
          aria-label={`Decrease quantity of ${item.name || 'product'}`} 
        />
        <Button 
          icon={<PlusOutlined />} 
          onClick={() => handleUpdateQuantity(item.quantity + 1)} 
          aria-label={`Increase quantity of ${item.name || 'product'}`} 
        />
        <Button 
          icon={<DeleteOutlined />} 
          onClick={handleRemove} 
          aria-label={`Remove ${item.name || 'product'} from cart`} 
        />
      </div>
    </div>
  );
};

export default React.memo(CartItem);