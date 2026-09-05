import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { LabContent, type LabContentProps } from '../src/app/lab';
import type {
  MechanicsReplayReceipt,
  MechanicsScenarioList,
} from '../src/lib/types';

const scenarios: MechanicsScenarioList = {
  schema_version: '1.0',
  corpus_version: '1',
  corpus_hash: '66bb04718599049f78be740df497de4e118cee123bd47f6941513035ce0d23be',
  engine_revision: '1',
  scenarios: [
    {
      id: 'seed0-classic',
      title: 'Classic opening bars (seed 0)',
      description: 'The unchanged AHFight scripted loop.',
      tags: ['golden'],
      seed: 0,
      fighters: { p1: 'AXEL', p2: 'VEX' },
      gels: { p1: 'sodium', p2: 'blue' },
      stage_id: 'rooftop',
      checkpoint_count: 7,
    },
    {
      id: 'rex-pressure-tape',
      title: 'REX pressure with scripted input tape',
      description: 'REX vs NYX with an ordered input tape.',
      tags: ['input-tape'],
      seed: 7,
      fighters: { p1: 'REX', p2: 'NYX' },
      gels: { p1: 'acid', p2: 'uv' },
      stage_id: 'warehouse',
      checkpoint_count: 6,
    },
  ],
};

function receipt(overrides: Partial<MechanicsReplayReceipt> = {}): MechanicsReplayReceipt {
  return {
    schema_version: '1.0',
    corpus_version: '1',
    corpus_hash: '66bb04718599049f78be740df497de4e118cee123bd47f6941513035ce0d23be',
    engine_revision: '1',
    scenario_id: 'seed0-classic',
    overridden: false,
    normalized_inputs: {
      seed: 0,
      p1_fighter_id: 'AXEL',
      p2_fighter_id: 'VEX',
      p1_gel: 'sodium',
      p2_gel: 'blue',
      stage_id: 'rooftop',
      input_tape: [],
      checkpoints: [0, 12, 32, 44, 60, 98, 127],
    },
    actual_checkpoints: {
      '0': { step: 0, bar: 0, p1: { hp: 0.78, meter: 0.24, rounds: 1 }, p2: { hp: 0.9, meter: 0.32, rounds: 0 }, timer: 60, combo: 0 },
      '12': { step: 12, bar: 0, p1: { hp: 0.78, meter: 0.24, rounds: 1 }, p2: { hp: 0.9, meter: 0.32, rounds: 0 }, timer: 60, combo: 0 },
    },
    expected_checkpoints: {
      '0': { step: 0, bar: 0, p1: { hp: 0.78, meter: 0.24, rounds: 1 }, p2: { hp: 0.9, meter: 0.32, rounds: 0 }, timer: 60, combo: 0 },
      '12': { step: 12, bar: 0, p1: { hp: 0.78, meter: 0.24, rounds: 1 }, p2: { hp: 0.9, meter: 0.32, rounds: 0 }, timer: 60, combo: 0 },
    },
    diffs: [],
    verdict: 'pass',
    ...overrides,
  };
}

function propsFor(overrides: Partial<LabContentProps> = {}): LabContentProps {
  return {
    access: 'eligible',
    revision: 'server',
    onSelectRevision: jest.fn(),
    scenarios,
    scenariosPending: false,
    scenariosError: null,
    selectedScenarioId: null,
    onSelectScenario: jest.fn(),
    receipt: null,
    replayPending: false,
    replayError: null,
    onRunGolden: jest.fn(),
    onRunOverride: jest.fn(),
    ...overrides,
  };
}

describe('LabContent rendered states', () => {
  it('renders receipt provenance independently of the selected corpus and requested revision', async () => {
    const view = await render(
      <LabContent {...propsFor({
        revision: '1',
        scenarios: { ...scenarios, engine_revision: '1', corpus_hash: 'list-hash' },
        receipt: receipt({ engine_revision: '2', corpus_hash: 'receipt-hash' }),
      })} />,
    );
    expect(view.getByText('schema 1.0 · corpus 1 · engine 1')).toBeTruthy();
    expect(view.getByText('schema 1.0 · corpus 1 · engine 2')).toBeTruthy();
    expect(view.getByText('corpus hash receipt-hash')).toBeTruthy();
    expect(view.getByText('corpus hash list-hash')).toBeTruthy();
  });

  it('fails closed in disabled builds with no scenario controls', async () => {
    const view = await render(<LabContent {...propsFor({ access: 'disabled' })} />);

    expect(view.getByText('MECHANICS LAB UNAVAILABLE')).toBeTruthy();
    expect(view.queryByRole('button', { name: 'lab-run-golden' })).toBeNull();
    expect(view.queryByRole('button', { name: 'lab-select-seed0-classic' })).toBeNull();
  });

  it('renders API mode required in fixture mode with zero replay observation', async () => {
    const props = propsFor({ access: 'fixture-required', scenarios: null });
    const view = await render(<LabContent {...props} />);

    expect(view.getByText('API MODE REQUIRED')).toBeTruthy();
    expect(view.queryByRole('button', { name: 'lab-run-golden' })).toBeNull();
    expect(props.onRunGolden).not.toHaveBeenCalled();
  });

  it('fails closed while unauthenticated and while the session loads', async () => {
    const unauthenticated = await render(<LabContent {...propsFor({ access: 'auth-required', scenarios: null })} />);
    expect(unauthenticated.getByText('AUTHENTICATION REQUIRED')).toBeTruthy();
    expect(unauthenticated.queryByRole('button', { name: 'lab-run-golden' })).toBeNull();

    const loading = await render(<LabContent {...propsFor({ access: 'loading', scenarios: null })} />);
    expect(loading.getByText('Loading session…')).toBeTruthy();
    expect(loading.queryByRole('button', { name: 'lab-run-golden' })).toBeNull();
  });

  it('states the corpus engine revision the server declared, revision 2 included', async () => {
    const revision1 = await render(<LabContent {...propsFor()} />);
    expect(revision1.getByText(/engine\s+1/)).toBeTruthy();

    const revision2 = await render(
      <LabContent {...propsFor({ scenarios: { ...scenarios, engine_revision: '2' } })} />,
    );
    expect(revision2.getByText(/engine\s+2/)).toBeTruthy();
    expect(revision2.getByText(/schema\s+1\.0/)).toBeTruthy();
  });

  it('offers SERVER / 1 / 2, defaults to SERVER, and forwards the pin the operator picks', async () => {
    const props = propsFor();
    const view = await render(<LabContent {...props} />);

    expect(view.getByText('LAB / ENGINE REVISION')).toBeTruthy();
    expect(view.getByTestId('select-lab-revision-server').props.accessibilityState.selected).toBe(
      true,
    );
    expect(view.getByTestId('select-lab-revision-1').props.accessibilityState.selected).toBe(false);
    expect(view.getByTestId('select-lab-revision-2').props.accessibilityState.selected).toBe(false);

    await fireEvent.press(view.getByTestId('select-lab-revision-1'));
    expect(props.onSelectRevision).toHaveBeenCalledWith('1');
    await fireEvent.press(view.getByTestId('select-lab-revision-2'));
    expect(props.onSelectRevision).toHaveBeenCalledWith('2');
    await fireEvent.press(view.getByTestId('select-lab-revision-server'));
    expect(props.onSelectRevision).toHaveBeenCalledWith('server');
  });

  it('marks the pinned choice without ever letting it speak for the declared revision', async () => {
    const view = await render(
      <LabContent
        {...propsFor({ revision: '1', scenarios: { ...scenarios, engine_revision: '2' } })}
      />,
    );

    expect(view.getByTestId('select-lab-revision-1').props.accessibilityState.selected).toBe(true);
    expect(view.getByTestId('select-lab-revision-server').props.accessibilityState.selected).toBe(
      false,
    );
    // The header states what the server declared (2), not what was asked for (1).
    expect(view.getByText('schema 1.0 · corpus 1 · engine 2')).toBeTruthy();
  });

  it('renders the unchanged not-found state when a pinned revision 404s', async () => {
    const view = await render(
      <LabContent
        {...propsFor({
          revision: '2',
          scenarios: null,
          scenariosError: 'CHOONZ API returned 404.',
        })}
      />,
    );

    expect(view.getByText('CHOONZ API returned 404.')).toBeTruthy();
    expect(view.queryByRole('button', { name: 'lab-select-seed0-classic' })).toBeNull();
    // The pin stays visible and switchable, so the operator can leave the empty corpus.
    expect(view.getByTestId('select-lab-revision-2').props.accessibilityState.selected).toBe(true);
  });

  it('never exposes the revision selector to an ineligible build', async () => {
    for (const access of ['disabled', 'fixture-required', 'auth-required', 'loading'] as const) {
      const view = await render(<LabContent {...propsFor({ access, scenarios: null })} />);
      expect(view.queryByTestId('select-lab-revision-server')).toBeNull();
      expect(view.queryByTestId('select-lab-revision-1')).toBeNull();
    }
  });

  it('lists selectable scenarios and runs the unchanged golden', async () => {
    const props = propsFor();
    const view = await render(<LabContent {...props} />);

    expect(view.getByRole('button', { name: 'lab-select-seed0-classic' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'lab-select-rex-pressure-tape' })).toBeTruthy();
    expect(view.queryByRole('button', { name: 'lab-run-golden' })).toBeNull();

    await fireEvent.press(view.getByRole('button', { name: 'lab-select-rex-pressure-tape' }));
    expect(props.onSelectScenario).toHaveBeenCalledWith('rex-pressure-tape');
  });

  it('shows replay controls for a selected scenario and forwards the golden run', async () => {
    const props = propsFor({ selectedScenarioId: 'seed0-classic' });
    const view = await render(<LabContent {...props} />);

    await fireEvent.press(view.getByRole('button', { name: 'lab-run-golden' }));
    expect(props.onRunGolden).toHaveBeenCalledTimes(1);
    expect(
      view.getByRole('button', { name: 'lab-run-override' }).props.accessibilityState.disabled,
    ).toBe(true);
  });

  it('sends a bounded seed override and never a non-integer', async () => {
    const props = propsFor({ selectedScenarioId: 'seed0-classic' });
    const view = await render(<LabContent {...props} />);

    await fireEvent.changeText(view.getByLabelText('lab-override-seed'), '42');
    const overrideButton = view.getByRole('button', { name: 'lab-run-override' });
    expect(overrideButton.props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(overrideButton);
    expect(props.onRunOverride).toHaveBeenCalledWith({ seed: 42 });

    await fireEvent.changeText(view.getByLabelText('lab-override-seed'), '4.5');
    await fireEvent.press(view.getByRole('button', { name: 'lab-run-override' }));
    expect(props.onRunOverride).toHaveBeenCalledTimes(1);
  });

  it('renders the server verdict and diffs in the returned order without recomputation', async () => {
    const props = propsFor({
      selectedScenarioId: 'seed0-classic',
      receipt: receipt({
        verdict: 'fail',
        diffs: [
          { path: 'checkpoints.44.p1.hp', expected: 0.7, actual: 0.76 },
          { path: 'checkpoints.2.timer', expected: 59, actual: 60 },
        ],
      }),
    });
    const view = await render(<LabContent {...props} />);

    expect(view.getByText('FAIL')).toBeTruthy();
    expect(view.getByText('checkpoints.44.p1.hp: expected 0.7 → actual 0.76')).toBeTruthy();
    expect(view.getByText('checkpoints.2.timer: expected 59 → actual 60')).toBeTruthy();
  });

  it('renders complete corpus identity and per-checkpoint actual/expected projections', async () => {
    const props = propsFor({
      selectedScenarioId: 'seed0-classic',
      receipt: receipt(),
    });
    const view = await render(<LabContent {...props} />);

    expect(view.getAllByText('schema 1.0 · corpus 1 · engine 1')).toHaveLength(2);
    expect(
      view.getAllByText('corpus hash 66bb04718599049f78be740df497de4e118cee123bd47f6941513035ce0d23be'),
    ).toHaveLength(2);
    expect(view.getByText(/step 0: actual .* expected /)).toBeTruthy();
    expect(view.getByText('gels sodium/blue · tape empty')).toBeTruthy();
  });

  it('marks overridden receipts NOT APPLICABLE even with empty diffs', async () => {
    const props = propsFor({
      selectedScenarioId: 'seed0-classic',
      receipt: receipt({ overridden: true, verdict: 'not_applicable' }),
    });
    const view = await render(<LabContent {...props} />);

    expect(view.getByText('NOT_APPLICABLE · OVERRIDDEN')).toBeTruthy();
  });

  it('disables replay while pending and surfaces replay errors', async () => {
    const pending = await render(
      <LabContent {...propsFor({ selectedScenarioId: 'seed0-classic', replayPending: true })} />,
    );
    expect(pending.getByText('Replaying through the backend engine…')).toBeTruthy();
    expect(
      pending.getByRole('button', { name: 'lab-run-golden' }).props.accessibilityState.disabled,
    ).toBe(true);

    const errored = await render(
      <LabContent
        {...propsFor({ selectedScenarioId: 'seed0-classic', replayError: 'CHOONZ API returned 404.' })}
      />,
    );
    expect(errored.getByText('CHOONZ API returned 404.')).toBeTruthy();
  });

  it('surfaces scenario list errors without exposing controls', async () => {
    const view = await render(
      <LabContent {...propsFor({ scenarios: null, scenariosError: 'CHOONZ API returned 401.' })} />,
    );
    expect(view.getByText('CHOONZ API returned 401.')).toBeTruthy();
    expect(view.queryByRole('button', { name: 'lab-select-seed0-classic' })).toBeNull();
  });
});
