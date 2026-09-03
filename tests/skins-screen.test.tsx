import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { SkinsContent } from '../src/app/skins';
import { fixtureMySkins, fixtureSkinCatalog } from '../src/lib/fixtures';
import type { SkinCatalog, SkinUnlockOutcome } from '../src/lib/types';

const EARNABLE = 'gel:sodium-ember';

function skinsProps(overrides: Record<string, unknown> = {}) {
  return {
    catalog: fixtureSkinCatalog,
    mySkins: fixtureMySkins,
    theme: undefined,
    selectSkin: jest.fn(),
    selecting: false,
    selectError: null,
    unlockSkin: jest.fn(),
    unlocking: null,
    unlockReports: {},
    unlockError: null,
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

  it('offers an unlock button for unowned earnable skins and calls back with the id', async () => {
    const props = skinsProps();
    const view = await render(<SkinsContent {...props} />);
    expect(view.getByText('UNLOCK')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: `unlock-skin-${EARNABLE}` }));
    expect(props.unlockSkin).toHaveBeenCalledWith(EARNABLE);
  });

  it('shows progress from a condition report and switches to CHECK PROGRESS', async () => {
    const report: SkinUnlockOutcome = {
      status: 'condition_not_met',
      condition: { id: 'complete_n_matches', required: 5, observed: 3 },
    };
    const view = await render(
      <SkinsContent {...skinsProps({ unlockReports: { [EARNABLE]: report } })} />,
    );
    expect(view.getByText(/3\/5 MATCHES/)).toBeTruthy();
    expect(view.getByText('CHECK PROGRESS')).toBeTruthy();
  });

  it('shows revoked copy and no button after a revoked report', async () => {
    const report: SkinUnlockOutcome = { status: 'revoked', message: 'revoked' };
    const view = await render(
      <SkinsContent {...skinsProps({ unlockReports: { [EARNABLE]: report } })} />,
    );
    expect(view.getAllByText(/REVOKED/).length).toBeGreaterThan(0);
    expect(view.queryByRole('button', { name: `unlock-skin-${EARNABLE}` })).toBeNull();
  });

  it('disables the unlock button while unlocking and shows the unlock error', async () => {
    const view = await render(
      <SkinsContent {...skinsProps({ unlocking: EARNABLE, unlockError: 'Could not unlock the skin: boom' })} />,
    );
    expect(view.getByText('UNLOCKING…')).toBeTruthy();
    expect(view.getByText('Could not unlock the skin: boom')).toBeTruthy();
  });

  it('keeps STORE inert for iap skins', async () => {
    const catalog: SkinCatalog = {
      ...fixtureSkinCatalog,
      skins: [
        ...fixtureSkinCatalog.skins,
        {
          id: 'gel:gold',
          kind: 'ui_theme',
          display_name: 'Gold',
          description: 'Store variant',
          entitlement: 'iap',
          base_gel: 'sodium',
          default: false,
          status: 'built',
        },
      ],
    };
    const view = await render(<SkinsContent {...skinsProps({ catalog })} />);
    expect(view.getByText('STORE')).toBeTruthy();
    expect(view.queryByRole('button', { name: 'unlock-skin-gel:gold' })).toBeNull();
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
