import { render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { AppScreen, BodyText } from '../src/ui/app-screen';

describe('AppScreen navigation', () => {
  it('exposes the primary navigation links with accessible labels', async () => {
    const view = await render(
      <AppScreen title="TEST SCREEN">
        <BodyText>Content</BodyText>
      </AppScreen>,
    );

    for (const label of ['STATUS', 'CATALOG', 'FIGHT', 'PROFILE']) {
      expect(view.getByRole('link', { name: label })).toBeTruthy();
      expect(view.getByLabelText(label)).toBeTruthy();
    }
  });
});
