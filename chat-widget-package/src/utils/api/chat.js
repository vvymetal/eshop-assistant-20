import { API_BASE_URL } from '../../config/constants';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
};

export const fetchLatestMessages = async (chatId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}/latest-messages`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching latest messages:', error);
    throw error;
  }
};

export const sendMessage = async (chatId, message) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_query: message }),
    });
    return response; // Vracíme přímo response objekt pro zpracování streamu
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const processStreamResponse = async (response, onTextUpdate, onCartUpdate) => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let accumulatedResponse = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });

    accumulatedResponse += chunk;
    const lines = accumulatedResponse.split('\n');
    accumulatedResponse = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonData = line.slice(5);
        try {
          const parsedData = JSON.parse(jsonData);
          if (parsedData.text?.value) {
            onTextUpdate(parsedData.text.value);
          }
          if (parsedData.cart_action) {
            onCartUpdate(parsedData.cart_action);
          }
        } catch (error) {
          console.error('Chyba při parsování JSON:', error);
        }
      }
    }
  }
};