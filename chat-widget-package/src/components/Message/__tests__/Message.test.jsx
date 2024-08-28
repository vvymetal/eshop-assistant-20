// src/components/Message/__tests__/Message.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import Message from '../Message';

describe('Message component', () => {
  it('renders user message correctly', () => {
    render(<Message content="Hello, world!" role="user" />);
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveClass('user');
  });

  it('renders assistant message correctly', () => {
    render(<Message content="How can I help you?" role="assistant" />);
    expect(screen.getByText('How can I help you?')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveClass('assistant');
  });

  it('renders markdown content correctly', () => {
    render(<Message content="**Bold** and *italic*" role="user" />);
    expect(screen.getByText('Bold')).toHaveStyle('font-weight: bold');
    expect(screen.getByText('italic')).toHaveStyle('font-style: italic');
  });
});