// src/components/CartColumn/CartColumn.jsx
import React from 'react';
import { Button, Spin } from 'antd';
import CartHeader from '../CartHeader/CartHeader';
import CartItem from '../CartItem/CartItem';
import CartSummary from '../CartSummary/CartSummary';
import { useCart } from '../../contexts/CartContext';
import styles from './CartColumn.module.css';

const CartColumn = ({ onOpenSettings }) => {
  const { 
    workingCart, 
    isCartMinimized,
    isCartLoading,
    cartSummary,
    handleCheckout,
    toggleCartMinimize
  } = useCart();

  console.log('CartColumn rendering', { workingCart, isCartMinimized, cartSummary, isCartLoading });
  console.log('workingCart:', workingCart);
  console.log('cartSummary:', cartSummary);

  const renderCartContent = () => {
    if (isCartLoading) {
      return <Spin tip="Loading cart..."/>;
    }
    if (workingCart.length === 0) {
      return (
        <div className={styles.emptyCart}>
          <p>Your cart is empty</p>
          <p>Add some items to get started!</p>
        </div>
      );
    }
    return workingCart.map((item) => (
      <CartItem key={item.product_id} item={item} />
    ));
  };

  return (
    <div className={`${styles.cartColumn} ${isCartMinimized ? styles.minimized : ''}`}>
      <CartHeader onOpenSettings={onOpenSettings} />
      <div className={styles.cartContent}>
        <div className={styles.cartItems}>
          {renderCartContent()}
        </div>
        <div className={styles.cartFooter}>
          <CartSummary summary={cartSummary} />
          <Button 
            className={styles.checkoutButton}
            onClick={handleCheckout}
            disabled={workingCart.length === 0 || isCartLoading}
          >
            Buy in e-shop ({cartSummary?.totalItems ?? 0} items)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartColumn;