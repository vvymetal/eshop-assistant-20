// src/components/ChatInput/__tests__/ChatInput.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatInput from '../ChatInput';

describe('ChatInput component', () => {
  const mockSetInputMessage = jest.fn();
  const mockSendMessage = jest.fn();
  const mockHandleVoiceInput = jest.fn();

  const defaultProps = {
    inputMessage: '',
    setInputMessage: mockSetInputMessage,
    sendMessage: mockSendMessage,
    isLoading: false,
    isListening: false,
    handleVoiceInput: mockHandleVoiceInput
  };

  it('renders input field and buttons correctly', () => {
    render(<ChatInput {...defaultProps} />);

    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    expect(screen.getByLabelText('Start voice input')).toBeInTheDocument();
  });

  it('updates input message when typing', () => {
    render(<ChatInput {...defaultProps} />);
    const input = screen.getByLabelText('Message input');

    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(mockSetInputMessage).toHaveBeenCalledWith('Hello');
  });

  it('calls sendMessage when send button is clicked', () => {
    render(<ChatInput {...defaultProps} />);
    const sendButton = screen.getByLabelText('Send message');

    fireEvent.click(sendButton);
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it('calls handleVoiceInput when voice button is clicked', () => {
    render(<ChatInput {...defaultProps} />);
    const voiceButton = screen.getByLabelText('Start voice input');

    fireEvent.click(voiceButton);
    expect(mockHandleVoiceInput).toHaveBeenCalledTimes(1);
  });

  it('disables input when isLoading is true', () => {
    render(<ChatInput {...defaultProps} isLoading={true} />);
    const input = screen.getByLabelText('Message input');

    expect(input).toBeDisabled();
  });

  it('shows "Listening..." tooltip when isListening is true', () => {
    render(<ChatInput {...defaultProps} isListening={true} />);
    const voiceButton = screen.getByLabelText('Start voice input');

    expect(voiceButton).toHaveAttribute('title', 'Listening...');
  });
});