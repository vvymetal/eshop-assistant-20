import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { message } from 'antd';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children, apiEndpoint, chatId }) => {
  const [workingCart, setWorkingCart] = useState([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isCartMinimized, setIsCartMinimized] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!chatId) {
      console.log('ChatId not initialized yet');
      return;
    }
    setIsCartLoading(true);
    try {
      console.log('Fetching cart for chatId:', chatId);
      console.log('API Endpoint:', apiEndpoint);
      const response = await fetch(`${apiEndpoint}/cart/${chatId}`);
      console.log('Full response:', response);
  
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
  
      const responseText = await response.text();
      console.log('Response text:', responseText);
  
      let cartData;
      try {
        cartData = JSON.parse(responseText);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        throw new Error('Invalid JSON response from server');
      }
  
      console.log('Parsed cart data:', cartData);
      if (cartData && cartData.data) {
        const cartItems = Array.isArray(cartData.data) ? cartData.data : [cartData.data];
        setWorkingCart(cartItems.map(item => ({
          product_id: item.product_id,
          name: item.name || 'Unnamed product',
          price: item.price !== undefined ? item.price : 'N/A',
          quantity: item.quantity || 1
        })));
      } else {
        console.warn('Received cart data is not in expected format:', cartData);
        setWorkingCart([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      console.error('Full error object:', error);
      setWorkingCart([]);
      message.error('Failed to load cart data. Please try again later.');
    } finally {
      setIsCartLoading(false);
    }
  }, [apiEndpoint, chatId]);

  const updateWorkingCart = useCallback((cartAction) => {
    console.log('Updating cart with action:', cartAction);
  
    let parsedAction;
    try {
      parsedAction = typeof cartAction === 'string' ? JSON.parse(cartAction) : cartAction;
    } catch (error) {
      console.error('Chyba při parsování cartAction:', error);
      return;
    }
  
    console.log('Zpracování akce košíku:', parsedAction);
  
    if (!parsedAction || typeof parsedAction !== 'object') {
      console.error('Neplatná struktura cartAction');
      return;
    }
  
    const { status, product_id, name, price, quantity } = parsedAction;
  
    setWorkingCart(prevCart => {
      let updatedCart = [...prevCart];
  
      switch (status) {
        case 'removed':
          updatedCart = updatedCart.filter(item => item.product_id !== product_id);
          break;
        case 'added':
        case 'updated':
          const existingItemIndex = updatedCart.findIndex(item => item.product_id === product_id);
          if (existingItemIndex !== -1) {
            updatedCart[existingItemIndex] = {
              ...updatedCart[existingItemIndex],
              quantity: quantity ?? updatedCart[existingItemIndex].quantity + 1,
              name: name || updatedCart[existingItemIndex].name,
              price: price ?? updatedCart[existingItemIndex].price
            };
          } else {
            updatedCart.push({
              product_id,
              name: name || 'Unnamed product',
              price: price ?? 'N/A',
              quantity: quantity ?? 1
            });
          }
          break;
        case 'cleared':
          updatedCart = [];
          break;
        default:
          console.warn(`Neznámá akce košíku: ${status}`);
          return prevCart;
      }
  
      console.log('Nový stav košíku:', updatedCart);
      return updatedCart;
    });
  
    // Zobrazení notifikace o změně košíku
    switch (status) {
      case 'removed':
        message.success(`Položka ${product_id} odebrána z košíku`);
        break;
      case 'added':
      case 'updated':
        message.success(`Položka ${name || product_id} přidána/aktualizována v košíku`);
        break;
      case 'cleared':
        message.success('Košík byl vyčištěn');
        break;
    }
  
    // Synchronizace s backendem
    fetch(`${apiEndpoint}/cart/${chatId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedAction),
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to update cart on server');
      return response.json();
    })
    .then(result => {
      console.log('Cart updated on server:', result);
      if (result.status === 'success') {
        console.log('Server update successful, fetching latest cart data');
        fetchCart(); // Získání aktuálního stavu košíku ze serveru
      } else {
        console.warn('Unexpected server response:', result);
        // Možná budete chtít zde přidat nějakou dodatečnou logiku nebo notifikaci
      }
    })
    .catch(error => {
      console.error('Error updating cart on server:', error);
      message.error('Failed to update cart on server. Please try again.');
      // Zde můžete přidat logiku pro obnovení původního stavu košíku v případě chyby
    });
  
    console.log('Aktualizace košíku dokončena');
  }, [apiEndpoint, chatId, fetchCart]);

  const cartSummary = useMemo(() => {
    const totalItems = workingCart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = workingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = 0; // Implement discount logic here if needed
    const finalPrice = totalPrice - discount;
    const saved = totalPrice - finalPrice;

    return { totalItems, totalPrice, discount, finalPrice, saved };
  }, [workingCart]);

  const toggleCartMinimize = useCallback(() => {
    setIsCartMinimized(prev => !prev);
  }, []);

  const handleCheckout = useCallback(() => {
    if (workingCart.length === 0) {
      message.warning('Košík je prázdný');
      return;
    }
    // Zde by měla být implementace checkoutu, zatím jen logujeme
    console.log('Checkout with items:', workingCart);
    message.success('Objednávka byla úspěšně odeslána!');
  }, [workingCart]);

  useEffect(() => {
    if (chatId) {
      fetchCart();
    }
  }, [chatId, fetchCart]);

  return (
    <CartContext.Provider value={{
      workingCart,
      isCartLoading,
      isCartMinimized,
      cartSummary,
      fetchCart,
      updateWorkingCart,
      toggleCartMinimize,
      handleCheckout
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;