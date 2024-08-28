// src/components/CartSummary/__tests__/CartSummary.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import CartSummary from '../CartSummary';

describe('CartSummary component', () => {
  it('renders cart summary correctly', () => {
    const props = {
      totalItems: 5,
      totalPrice: 100,
      discount: 10,
      finalPrice: 90,
      saved: 10
    };

    render(<CartSummary {...props} />);

    expect(screen.getByText('Items: 5')).toBeInTheDocument();
    expect(screen.getByText('Total: $100.00')).toBeInTheDocument();
    expect(screen.getByText('Discount: $10.00')).toBeInTheDocument();
    expect(screen.getByText('Final Price: $90.00')).toBeInTheDocument();
    expect(screen.getByText('You save: $10.00')).toBeInTheDocument();
  });

  it('does not render discount and saved amount when they are 0', () => {
    const props = {
      totalItems: 3,
      totalPrice: 50,
      discount: 0,
      finalPrice: 50,
      saved: 0
    };

    render(<CartSummary {...props} />);

    expect(screen.getByText('Items: 3')).toBeInTheDocument();
    expect(screen.getByText('Total: $50.00')).toBeInTheDocument();
    expect(screen.getByText('Final Price: $50.00')).toBeInTheDocument();
    expect(screen.queryByText('Discount:')).not.toBeInTheDocument();
    expect(screen.queryByText('You save:')).not.toBeInTheDocument();
  });
});