// src/components/CartSummary/CartSummary.jsx
import React from 'react';
import styles from './CartSummary.module.css';

const CartSummary = ({ summary }) => {
  console.log('CartSummary rendering', summary);

  if (!summary) {
    return <div>Loading summary...</div>;
  }

  return (
    <div className={styles.cartSummary}>
      <p>Items: {summary.totalItems}</p>
      <p>Total: ${summary.totalPrice.toFixed(2)}</p>
      <p>Discount: ${summary.discount.toFixed(2)}</p>
      <p>Final Price: ${summary.finalPrice.toFixed(2)}</p>
      <p>You save: ${summary.saved.toFixed(2)}</p>
    </div>
  );
};

export default React.memo(CartSummary);