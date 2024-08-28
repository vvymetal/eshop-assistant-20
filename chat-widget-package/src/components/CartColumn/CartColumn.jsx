// src/components/CartColumn/CartColumn.jsx
import React from 'react';
import { Button } from 'antd';
import CartHeader from '../CartHeader/CartHeader';
import CartItem from '../CartItem/CartItem';
import CartSummary from '../CartSummary/CartSummary';
import { useCart } from '../../contexts/CartContext';
import styles from './CartColumn.module.css';

const CartColumn = ({ onOpenSettings }) => {
  const { 
    workingCart, 
    isCartMinimized,
    cartSummary,
    handleCheckout,
    toggleCartMinimize
  } = useCart();

  console.log('CartColumn rendering', { workingCart, isCartMinimized, cartSummary });

  return (
    <div className={`${styles.cartColumn} ${isCartMinimized ? styles.minimized : ''}`}>
      <CartHeader onOpenSettings={onOpenSettings} />
      <div className={styles.cartContent}>
        <div className={styles.cartItems}>
          {workingCart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            workingCart.map((item) => (
              <CartItem key={item.product_id} item={item} />
            ))
          )}
        </div>
        <div className={styles.cartFooter}>
          <CartSummary summary={cartSummary} />
          <Button 
            className={styles.checkoutButton}
            onClick={handleCheckout}
            disabled={workingCart.length === 0}
          >
            Buy in e-shop ({cartSummary?.totalItems ?? 0} items)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartColumn;