import { act, fireEvent, render, renderHook } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import {
  AuthRecoveryGuidance,
  DELETE_DENIED_COPY,
  DELETE_INVALID_COPY,
  DELETE_UNAVAILABLE_COPY,
  ProfileContent,
  useAccountDeletion,
} from '../src/app/profile';
import { ChoonzClientError } from '../src/lib/errors';
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
    deleteRetryable: false,
    onRequestDelete: jest.fn(),
    onCancelDelete: jest.fn(),
    onConfirmDelete: jest.fn(),
    onRetryDelete: jest.fn(),
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

  it('offers a retry affordance only while the failure is retryable', async () => {
    const idle = props({ deleteConfirming: true, deleteTypedConfirm: 'DELETE MY ACCOUNT' });
    const idleView = await render(<ProfileContent {...idle} />);
    expect(idleView.queryByRole('button', { name: 'retry-delete-account' })).toBeNull();

    const retryable = props({
      deleteConfirming: true,
      deleteTypedConfirm: 'DELETE MY ACCOUNT',
      deleteRetryable: true,
      deleteError: DELETE_UNAVAILABLE_COPY,
    });
    const retryView = await render(<ProfileContent {...retryable} />);
    expect(retryView.getByText(DELETE_UNAVAILABLE_COPY)).toBeTruthy();
    await fireEvent.press(retryView.getByRole('button', { name: 'retry-delete-account' }));
    expect(retryable.onRetryDelete).toHaveBeenCalledTimes(1);
    expect(retryView.getByRole('button', { name: 'confirm-delete-account' })).toBeTruthy();
    expect(retryView.getByRole('button', { name: 'cancel-delete-account' })).toBeTruthy();
  });

  it('hides account deletion in fixture mode', async () => {
    const view = await render(<ProfileContent {...props({ fixture: true, canDeleteAccount: false })} />);
    expect(view.queryByRole('button', { name: 'request-delete-account' })).toBeNull();
  });
});

async function deletionHarness(deleteAccount: () => Promise<void>) {
  const signOut = jest.fn(async () => undefined);
  const clearQueries = jest.fn();
  const view = await renderHook(() =>
    useAccountDeletion({ deleteAccount, signOut, clearQueries }),
  );
  const start = async () => {
    await act(async () => {
      view.result.current.request();
    });
    await act(async () => {
      view.result.current.confirm();
    });
  };
  return { ...view, signOut, clearQueries, start };
}

describe('useAccountDeletion (DELETE /me per-status contract)', () => {
  it('finalizes the local session on a 204 success', async () => {
    const deleteAccount = jest.fn(async () => undefined);
    const harness = await deletionHarness(deleteAccount);
    await harness.start();

    expect(deleteAccount).toHaveBeenCalledTimes(1);
    expect(harness.signOut).toHaveBeenCalledTimes(1);
    expect(harness.clearQueries).toHaveBeenCalledTimes(1);
    expect(harness.result.current.error).toBeNull();
    expect(harness.result.current.confirming).toBe(false);
    expect(harness.result.current.deleting).toBe(false);
  });

  it('treats a 404 as already deleted and clears exactly like success', async () => {
    const harness = await deletionHarness(async () => {
      throw new ChoonzClientError('response', 'CHOONZ API returned 404.', 404);
    });
    await harness.start();

    expect(harness.signOut).toHaveBeenCalledTimes(1);
    expect(harness.clearQueries).toHaveBeenCalledTimes(1);
    expect(harness.result.current.error).toBeNull();
    expect(harness.result.current.confirming).toBe(false);
    expect(harness.result.current.retryable).toBe(false);
  });

  it('shows the server detail message on a 422 and keeps the session', async () => {
    const harness = await deletionHarness(async () => {
      throw new ChoonzClientError('response', 'CHOONZ API returned 422.', 422, {
        code: 'confirm_required',
        message: 'Deletion requires confirm=true.',
        extra: {},
      });
    });
    await harness.start();

    expect(harness.result.current.error).toBe('Deletion requires confirm=true.');
    expect(harness.result.current.retryable).toBe(false);
    expect(harness.signOut).not.toHaveBeenCalled();
    expect(harness.clearQueries).not.toHaveBeenCalled();
  });

  it('falls back to generic 422 copy when the server sends no detail', async () => {
    const harness = await deletionHarness(async () => {
      throw new ChoonzClientError('response', 'CHOONZ API returned 422.', 422);
    });
    await harness.start();

    expect(harness.result.current.error).toBe(DELETE_INVALID_COPY);
  });

  it('shows first-party denial copy on a 403', async () => {
    const harness = await deletionHarness(async () => {
      throw new ChoonzClientError('response', 'CHOONZ API returned 403.', 403);
    });
    await harness.start();

    expect(harness.result.current.error).toBe(DELETE_DENIED_COPY);
    expect(harness.result.current.retryable).toBe(false);
    expect(harness.signOut).not.toHaveBeenCalled();
  });

  it('keeps the confirm state and offers retry on a 5xx, and the retry re-invokes deletion', async () => {
    let attempts = 0;
    const deleteAccount = jest.fn(async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new ChoonzClientError('response', 'CHOONZ API returned 500.', 500);
      }
    });
    const harness = await deletionHarness(deleteAccount);
    await act(async () => {
      harness.result.current.request();
    });
    await act(async () => {
      harness.result.current.setTypedConfirm('DELETE MY ACCOUNT');
    });
    await act(async () => {
      harness.result.current.confirm();
    });

    expect(harness.result.current.error).toBe(DELETE_UNAVAILABLE_COPY);
    expect(harness.result.current.retryable).toBe(true);
    expect(harness.result.current.confirming).toBe(true);
    expect(harness.result.current.typedConfirm).toBe('DELETE MY ACCOUNT');
    expect(harness.clearQueries).not.toHaveBeenCalled();

    await act(async () => {
      harness.result.current.retry();
    });

    expect(deleteAccount).toHaveBeenCalledTimes(2);
    expect(harness.signOut).toHaveBeenCalledTimes(1);
    expect(harness.clearQueries).toHaveBeenCalledTimes(1);
    expect(harness.result.current.error).toBeNull();
    expect(harness.result.current.confirming).toBe(false);
  });

  it('keeps the confirm state and offers retry when the API is unreachable', async () => {
    const harness = await deletionHarness(async () => {
      throw new ChoonzClientError('network', 'Could not reach the CHOONZ API.');
    });
    await harness.start();

    expect(harness.result.current.error).toBe(DELETE_UNAVAILABLE_COPY);
    expect(harness.result.current.retryable).toBe(true);
    expect(harness.result.current.confirming).toBe(true);
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
