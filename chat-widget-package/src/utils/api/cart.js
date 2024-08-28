// /src/utils/api/cart.js

export const fetchCart = async (apiEndpoint, chatId) => {
    try {
      console.log('Fetching cart for chatId:', chatId);
      const response = await fetch(`${apiEndpoint}/cart/${chatId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const cartData = await response.json();
      console.log('Fetched cart data:', cartData);
      if (cartData && cartData.data) {
        return Array.isArray(cartData.data) ? cartData.data : [cartData.data];
      } else {
        console.warn('Received cart data is not in expected format:', cartData);
        return [];
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  };
  
  export const updateCart = async (apiEndpoint, chatId, cartAction) => {
    try {
      console.log('Updating cart with action:', cartAction);
      const response = await fetch(`${apiEndpoint}/cart/${chatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartAction),
      });
      if (!response.ok) {
        throw new Error('Failed to update cart on server');
      }
      const updatedCart = await response.json();
      console.log('Cart updated on server:', updatedCart);
      if (updatedCart && updatedCart.data) {
        return Array.isArray(updatedCart.data) ? updatedCart.data : [updatedCart.data];
      } else {
        console.warn('Received updated cart data is not in expected format:', updatedCart);
        return [];
      }
    } catch (error) {
      console.error('Error updating cart on server:', error);
      throw error;
    }
  };
  
  export const calculateCartSummary = (workingCart) => {
    const totalItems = workingCart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = workingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Assume discount logic here - this should be implemented based on your business rules
    const discount = 0; // For now, we're not applying any discount
    const finalPrice = totalPrice - discount;
    const saved = totalPrice - finalPrice;
  
    return { totalItems, totalPrice, discount, finalPrice, saved };
  };