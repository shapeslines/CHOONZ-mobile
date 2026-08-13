import { render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { CatalogFeedback } from '../src/app/catalog';

describe('CatalogFeedback', () => {
  it('announces loading as a busy progress status without changing the visible copy', async () => {
    const view = await render(<CatalogFeedback pending failure={null} />);

    expect(view.getByText('Loading read-only catalog…')).toBeTruthy();
    const progress = view.getByLabelText('Loading read-only catalog…');
    expect(progress.props.accessibilityRole).toBe('progressbar');
    expect(progress.props.accessibilityLiveRegion).toBe('polite');
    expect(progress.props.accessibilityState.busy).toBe(true);
  });

  it('announces catalog query failure as an assertive alert', async () => {
    const view = await render(
      <CatalogFeedback pending={false} failure="Catalog is temporarily unavailable." />,
    );

    const alert = view.getByRole('alert', { name: 'Catalog is temporarily unavailable.' });
    expect(alert).toBeTruthy();
    expect(alert.props.accessibilityLiveRegion).toBe('assertive');
    expect(view.getByText('Catalog is temporarily unavailable.')).toBeTruthy();
  });
});
