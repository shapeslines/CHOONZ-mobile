import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { SkinsContent } from '../src/app/skins';
import { fixtureMySkins, fixtureSkinCatalog } from '../src/lib/fixtures';
import type { SkinCatalog } from '../src/lib/types';

function skinsProps(overrides: Record<string, unknown> = {}) {
  return {
    catalog: fixtureSkinCatalog,
    mySkins: fixtureMySkins,
    theme: undefined,
    selectSkin: jest.fn(),
    selecting: false,
    selectError: null,
    ...overrides,
  };
}

describe('SkinsContent', () => {
  it('lists theme skins and marks the active selection', async () => {
    const view = await render(<SkinsContent {...skinsProps()} />);
    expect(view.getByText('Sodium')).toBeTruthy();
    expect(view.getByText('Red')).toBeTruthy();
    expect(view.getByText('ACTIVE')).toBeTruthy(); // sodium is the default selection
  });

  it('selects a skin through the provided callback', async () => {
    const props = skinsProps();
    const view = await render(<SkinsContent {...props} />);
    await fireEvent.press(view.getByRole('button', { name: 'select-skin-gel:red' }));
    expect(props.selectSkin).toHaveBeenCalledWith({ kind: 'ui_theme', skin_id: 'gel:red' });
  });

  it('switches kinds via tabs', async () => {
    const view = await render(<SkinsContent {...skinsProps()} />);
    await fireEvent.press(view.getByRole('button', { name: 'skin-kind-character' }));
    expect(view.getByText('AXEL')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'skin-kind-scene_vibe' }));
    expect(view.getByText('Rooftop')).toBeTruthy();
  });

  it('shows locked copy for unowned earnable skins', async () => {
    const catalog: SkinCatalog = {
      ...fixtureSkinCatalog,
      skins: [
        ...fixtureSkinCatalog.skins,
        {
          id: 'gel:gold',
          kind: 'ui_theme',
          display_name: 'Gold',
          description: 'Earnable variant',
          entitlement: 'earnable',
          base_gel: 'sodium',
          default: false,
          status: 'built',
        },
      ],
    };
    const view = await render(<SkinsContent {...skinsProps({ catalog })} />);
    expect(view.getByText('UNLOCK')).toBeTruthy();
  });

  it('shows the selection error when the mutation failed', async () => {
    const view = await render(
      <SkinsContent {...skinsProps({ selectError: 'Could not update the skin selection.' })} />,
    );
    expect(view.getByText('Could not update the skin selection.')).toBeTruthy();
  });

  it('renders the loading state without a catalog', async () => {
    const view = await render(<SkinsContent {...skinsProps({ catalog: undefined })} />);
    expect(view.getByText(/Loading the skin catalog/)).toBeTruthy();
  });
});
