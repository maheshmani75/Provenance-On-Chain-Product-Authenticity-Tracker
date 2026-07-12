import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterProductForm from '../components/RegisterProductForm';

describe('RegisterProductForm', () => {
  it('disables submit until both fields are filled', () => {
    render(<RegisterProductForm onRegister={vi.fn()} loading={false} registeredProductId={null} />);
    expect(screen.getByText('Register on-chain')).toBeDisabled();
  });

  it('calls onRegister with name and serial number', async () => {
    const onRegister = vi.fn();
    render(<RegisterProductForm onRegister={onRegister} loading={false} registeredProductId={null} />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Leather Wallet — Chestnut'), 'Sneakers #7');
    await user.type(screen.getByPlaceholderText('SN-00042'), 'SN-00099');
    await user.click(screen.getByText('Register on-chain'));

    expect(onRegister).toHaveBeenCalledWith({ name: 'Sneakers #7', serialNumber: 'SN-00099' });
  });

  it('shows the registered product ID once available', () => {
    render(<RegisterProductForm onRegister={vi.fn()} loading={false} registeredProductId="4" />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
