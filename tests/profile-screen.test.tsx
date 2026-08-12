import { render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { AuthRecoveryGuidance } from '../src/app/profile';

describe('AuthRecoveryGuidance', () => {
  it('renders bounded recovery guidance without inventing a recovery action', async () => {
    const { getByText, queryByRole } = await render(<AuthRecoveryGuidance />);

    expect(getByText('NEED TO RECOVER ACCESS?')).toBeTruthy();
    expect(getByText(/If your session expired, sign in again/)).toBeTruthy();
    expect(getByText(/configured auth provider/)).toBeTruthy();
    expect(getByText(/never asks for recovery codes/)).toBeTruthy();
    expect(queryByRole('button')).toBeNull();
  });
});
