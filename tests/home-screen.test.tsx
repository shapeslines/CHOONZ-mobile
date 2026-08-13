import { render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import StatusScreen from '../src/app/index';

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: { env: 'fixture', engine_loop: 128, status: 'ok', version: 'test' },
    isError: false,
    isPending: false,
  }),
}));

jest.mock('../src/providers/api-provider', () => ({
  useChoonzApi: () => ({ getHealth: jest.fn() }),
}));

jest.mock('../src/providers/auth-provider', () => ({
  useAuth: () => ({ status: 'fixture', user: null }),
}));

jest.mock('../src/providers/runtime-config-provider', () => ({
  useRuntimeConfig: () => ({ configurationIssue: null }),
}));

describe('StatusScreen practice loop entry', () => {
  it('exposes the fight link with the visible action as its accessible name', async () => {
    const view = await render(<StatusScreen />);

    expect(view.getByRole('link', { name: 'OPEN FIGHT' })).toBeTruthy();
    expect(view.getByLabelText('OPEN FIGHT')).toBeTruthy();
  });
});
