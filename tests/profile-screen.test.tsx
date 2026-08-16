import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { AuthRecoveryGuidance, ProfileContent } from '../src/app/profile';
import type { ChoonzUser } from '../src/lib/types';

const user: ChoonzUser = {
  id: 7,
  email: 'fighter@choonz.example',
  display_name: 'Fighter',
  created_at: '2026-08-10T00:00:00Z',
};

function props(overrides = {}) {
  return {
    modeLabel: 'API / AUTHENTICATED / fighter@choonz.example',
    fixture: false,
    data: user,
    pending: false,
    queryError: null,
    displayName: 'Fighter',
    onDisplayNameChange: jest.fn(),
    onSave: jest.fn(),
    saveDisabled: true,
    saving: false,
    saveError: null,
    canSignOut: true,
    signOutConfirming: false,
    signingOut: false,
    signOutError: null,
    onRequestSignOut: jest.fn(),
    onCancelSignOut: jest.fn(),
    onConfirmSignOut: jest.fn(),
    canDeleteAccount: true,
    deleteConfirming: false,
    deleteTypedConfirm: '',
    onDeleteTypedConfirmChange: jest.fn(),
    deleting: false,
    deleteError: null,
    onRequestDelete: jest.fn(),
    onCancelDelete: jest.fn(),
    onConfirmDelete: jest.fn(),
    ...overrides,
  };
}

describe('ProfileContent', () => {
  it('shows session identity and disables unchanged save', async () => {
    const view = await render(<ProfileContent {...props()} />);
    expect(view.getByText('API / AUTHENTICATED / fighter@choonz.example')).toBeTruthy();
    expect(view.getByRole('button', { name: 'save-display-name' }).props.accessibilityState.disabled).toBe(true);
    expect(view.getByRole('link', { name: 'VIEW CONNECTIONS' })).toBeTruthy();
  });

  it('submits changed display-name input and flags overlength input', async () => {
    const changed = props({ displayName: 'New Fighter', saveDisabled: false });
    const view = await render(<ProfileContent {...changed} />);
    await fireEvent.press(view.getByRole('button', { name: 'save-display-name' }));
    expect(changed.onSave).toHaveBeenCalledTimes(1);

    const invalidView = await render(
      <ProfileContent {...props({ displayName: 'x'.repeat(121), saveDisabled: true })} />,
    );
    expect(invalidView.getByText('Display name must be 120 characters or fewer.')).toBeTruthy();
  });

  it('uses an inline two-step local-session sign-out confirmation', async () => {
    const initial = props();
    const view = await render(<ProfileContent {...initial} />);
    await fireEvent.press(view.getByRole('button', { name: 'request-sign-out' }));
    expect(initial.onRequestSignOut).toHaveBeenCalledTimes(1);

    const confirming = props({ signOutConfirming: true });
    const confirmingView = await render(<ProfileContent {...confirming} />);
    expect(confirmingView.getByText('Sign-out affects only the current device and local session.')).toBeTruthy();
    await fireEvent.press(confirmingView.getByRole('button', { name: 'confirm-sign-out' }));
    expect(confirming.onConfirmSignOut).toHaveBeenCalledTimes(1);
  });

  it('labels fixture persistence honestly', async () => {
    const view = await render(
      <ProfileContent {...props({ fixture: true, modeLabel: 'FIXTURE / LOCAL ACCOUNT' })} />,
    );
    expect(view.getByText(/reset with the fixture session/)).toBeTruthy();
  });

  it('requires a typed confirmation before account deletion', async () => {
    const initial = props();
    const view = await render(<ProfileContent {...initial} />);
    await fireEvent.press(view.getByRole('button', { name: 'request-delete-account' }));
    expect(initial.onRequestDelete).toHaveBeenCalledTimes(1);

    const confirming = props({ deleteConfirming: true });
    const confirmingView = await render(<ProfileContent {...confirming} />);
    const confirmButton = confirmingView.getByRole('button', { name: 'confirm-delete-account' });
    expect(confirmButton.props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(confirmingView.getByLabelText('delete-account-confirm'), 'DELETE MY ACCOUNT');
    const enabled = props({
      deleteConfirming: true,
      deleteTypedConfirm: 'DELETE MY ACCOUNT',
    });
    const enabledView = await render(<ProfileContent {...enabled} />);
    const readyButton = enabledView.getByRole('button', { name: 'confirm-delete-account' });
    expect(readyButton.props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(readyButton);
    expect(enabled.onConfirmDelete).toHaveBeenCalledTimes(1);
    await fireEvent.press(enabledView.getByRole('button', { name: 'cancel-delete-account' }));
    expect(enabled.onCancelDelete).toHaveBeenCalledTimes(1);
  });

  it('hides account deletion in fixture mode', async () => {
    const view = await render(<ProfileContent {...props({ fixture: true, canDeleteAccount: false })} />);
    expect(view.queryByRole('button', { name: 'request-delete-account' })).toBeNull();
  });
});

describe('AuthRecoveryGuidance', () => {
  it('states recovery is unavailable and exposes no action', async () => {
    const view = await render(<AuthRecoveryGuidance />);
    expect(view.getByText(/recovery is unavailable in this screen and build/i)).toBeTruthy();
    expect(view.queryByRole('button')).toBeNull();
    expect(view.queryByRole('link')).toBeNull();
  });
});
