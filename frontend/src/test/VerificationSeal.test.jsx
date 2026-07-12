import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerificationSeal from '../components/VerificationSeal';

const sampleProduct = {
  name: 'Leather Wallet — Chestnut',
  serial_number: 'SN-00042',
  flagged_counterfeit: false,
};

const sampleHistory = [
  { from: 'GMANUFACTURER1111111111111111111111111111111111111111', to: 'GDISTRIBUTOR22222222222222222222222222222222222222222', location: 'Regional warehouse' },
];

describe('VerificationSeal', () => {
  it('shows an empty state when no product is loaded', () => {
    render(<VerificationSeal product={null} history={[]} onFlag={vi.fn()} flagLoading={false} />);
    expect(screen.getByText(/no product loaded/i)).toBeInTheDocument();
  });

  it('shows "Verified authentic" for an unflagged product', () => {
    render(<VerificationSeal product={sampleProduct} history={sampleHistory} onFlag={vi.fn()} flagLoading={false} />);
    expect(screen.getByText('Verified authentic')).toBeInTheDocument();
  });

  it('shows the flagged state and hides the report button when already flagged', () => {
    const flagged = { ...sampleProduct, flagged_counterfeit: true };
    render(<VerificationSeal product={flagged} history={sampleHistory} onFlag={vi.fn()} flagLoading={false} />);
    expect(screen.getByText('Flagged as suspected counterfeit')).toBeInTheDocument();
    expect(screen.queryByText('Report as counterfeit')).not.toBeInTheDocument();
  });

  it('calls onFlag when the report button is clicked', async () => {
    const onFlag = vi.fn();
    render(<VerificationSeal product={sampleProduct} history={sampleHistory} onFlag={onFlag} flagLoading={false} />);
    const user = userEvent.setup();
    await user.click(screen.getByText('Report as counterfeit'));
    expect(onFlag).toHaveBeenCalledTimes(1);
  });
});
