// src/components/CartHeader/__tests__/CartHeader.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CartHeader from '../CartHeader';

describe('CartHeader component', () => {
  it('renders cart header correctly when not minimized', () => {
    const mockMinimize = jest.fn();
    const mockOpenSettings = jest.fn();

    render(
      <CartHeader 
        isMinimized={false} 
        onMinimize={mockMinimize} 
        onOpenSettings={mockOpenSettings} 
      />
    );

    expect(screen.getByText('Working Cart')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimize cart')).toBeInTheDocument();
    expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
  });

  it('renders cart header correctly when minimized', () => {
    const mockMinimize = jest.fn();
    const mockOpenSettings = jest.fn();

    render(
      <CartHeader 
        isMinimized={true} 
        onMinimize={mockMinimize} 
        onOpenSettings={mockOpenSettings} 
      />
    );

    expect(screen.getByText('Working Cart')).toBeInTheDocument();
    expect(screen.getByLabelText('Expand cart')).toBeInTheDocument();
    expect(screen.getByLabelText('Open settings')).toBeInTheDocument();
  });

  it('calls onMinimize when minimize button is clicked', () => {
    const mockMinimize = jest.fn();
    const mockOpenSettings = jest.fn();

    render(
      <CartHeader 
        isMinimized={false} 
        onMinimize={mockMinimize} 
        onOpenSettings={mockOpenSettings} 
      />
    );

    fireEvent.click(screen.getByLabelText('Minimize cart'));
    expect(mockMinimize).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenSettings when settings button is clicked', () => {
    const mockMinimize = jest.fn();
    const mockOpenSettings = jest.fn();

    render(
      <CartHeader 
        isMinimized={false} 
        onMinimize={mockMinimize} 
        onOpenSettings={mockOpenSettings} 
      />
    );

    fireEvent.click(screen.getByLabelText('Open settings'));
    expect(mockOpenSettings).toHaveBeenCalledTimes(1);
  });
});