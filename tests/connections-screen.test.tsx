import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { ConnectionsContent } from '../src/app/connections';
import type { ChoonzConnection } from '../src/lib/types';

const connection: ChoonzConnection = {
  client_id: 'scoreboard',
  client_name: 'Scoreboard',
  scopes: ['profile:read', 'matches:read'],
  created_at: '2026-08-10T00:00:00Z',
};

const secondConnection: ChoonzConnection = {
  client_id: 'analytics',
  client_name: 'Analytics',
  scopes: ['profile:read'],
  created_at: '2026-08-09T00:00:00Z',
};

function props(overrides = {}) {
  return {
    fixture: false,
    data: [connection],
    pending: false,
    queryError: null,
    confirmingClientId: null,
    revoking: false,
    revokeError: null,
    onRequestRevoke: jest.fn(),
    onCancelRevoke: jest.fn(),
    onConfirmRevoke: jest.fn(),
    ...overrides,
  };
}

describe('ConnectionsContent', () => {
  it('renders client name, id, scopes, and connection date', async () => {
    const view = await render(<ConnectionsContent {...props()} />);
    expect(view.getByText('Scoreboard')).toBeTruthy();
    expect(view.getByText('ID / scoreboard')).toBeTruthy();
    expect(view.getByText('SCOPES / profile:read, matches:read')).toBeTruthy();
    expect(view.getByText('CONNECTED / 2026-08-10')).toBeTruthy();
  });

  it('requires inline confirmation before revoke', async () => {
    const initial = props();
    const view = await render(<ConnectionsContent {...initial} />);
    await fireEvent.press(view.getByRole('button', { name: 'request-revoke-scoreboard' }));
    expect(initial.onRequestRevoke).toHaveBeenCalledWith('scoreboard');

    const confirming = props({ confirmingClientId: 'scoreboard' });
    const confirmingView = await render(<ConnectionsContent {...confirming} />);
    await fireEvent.press(
      confirmingView.getByRole('button', { name: 'confirm-revoke-scoreboard' }),
    );
    expect(confirming.onConfirmRevoke).toHaveBeenCalledWith('scoreboard');
  });

  it('disables other revoke actions while a revocation is pending', async () => {
    const view = await render(
      <ConnectionsContent
        {...props({
          data: [connection, secondConnection],
          confirmingClientId: connection.client_id,
          revoking: true,
        })}
      />,
    );

    const otherRevoke = view.getByRole('button', { name: 'request-revoke-analytics' });
    expect(otherRevoke.props.accessibilityState.disabled).toBe(true);
  });

  it('preserves confirmed rows while an error is displayed', async () => {
    const view = await render(<ConnectionsContent {...props({ revokeError: 'CHOONZ API returned 404.' })} />);
    expect(view.getByText('CHOONZ API returned 404.')).toBeTruthy();
    expect(view.getByText('Scoreboard')).toBeTruthy();
  });

  it('labels fixture reset semantics', async () => {
    const view = await render(<ConnectionsContent {...props({ fixture: true })} />);
    expect(view.getByText(/reset with the fixture session/)).toBeTruthy();
  });
});
