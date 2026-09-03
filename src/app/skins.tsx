import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isOwned, skinsByKind } from '@/lib/skins';
import type { SkinKind, SkinSummary, SkinUnlockOutcome } from '@/lib/types';
import { useSkins } from '@/providers/skin-provider';
import { AppScreen, BodyText, Panel, PanelTitle } from '@/ui/app-screen';
import { tokens } from '@/ui/tokens';

const KINDS: { kind: SkinKind; label: string }[] = [
  { kind: 'ui_theme', label: 'THEME' },
  { kind: 'scene_vibe', label: 'VIBE' },
  { kind: 'character', label: 'CHARACTER' },
];

export function SkinsContent(props?: Partial<ReturnType<typeof useSkins>>) {
  const context = useSkins();
  const {
    catalog,
    mySkins,
    selectSkin,
    selecting,
    selectError,
    unlockSkin,
    unlocking,
    unlockReports,
    unlockError,
  } = { ...context, ...props };
  const [activeKind, setActiveKind] = useState<SkinKind>('ui_theme');

  if (!catalog) {
    return (
      <Panel>
        <PanelTitle>SKINS</PanelTitle>
        <BodyText>Loading the skin catalog…</BodyText>
      </Panel>
    );
  }

  const skins = skinsByKind(catalog, activeKind);
  const selection =
    mySkins?.selection[activeKind] ??
    skins.find((skin) => skin.default)?.id ??
    skins[0]?.id;

  return (
    <>
      <Panel>
        <PanelTitle>SKIN SELECTION</PanelTitle>
        <BodyText>
          Skins are presentation only — they change how the fight renders, never how it
          computes. Selection syncs to your CHOONZ account.
        </BodyText>
        <View style={styles.tabs}>
          {KINDS.map(({ kind, label }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`skin-kind-${kind}`}
              key={kind}
              onPress={() => setActiveKind(kind)}
              style={[styles.tab, activeKind === kind ? styles.tabActive : null]}
            >
              <Text style={styles.tabText}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {selectError ? <Text style={styles.error}>{selectError}</Text> : null}
        {unlockError ? <Text style={styles.error}>{unlockError}</Text> : null}
      </Panel>

      <Panel>
        <PanelTitle>{activeKind.toUpperCase()} SKINS</PanelTitle>
        {skins.map((skin) => (
          <SkinRow
            key={skin.id}
            skin={skin}
            selected={skin.id === selection}
            owned={isOwned(skin, mySkins)}
            selecting={selecting}
            onSelect={() => selectSkin({ kind: activeKind, skin_id: skin.id })}
            unlocking={unlocking === skin.id}
            report={unlockReports?.[skin.id]}
            onUnlock={() => unlockSkin(skin.id)}
          />
        ))}
      </Panel>
    </>
  );
}

const CONDITION_LABELS: Record<string, string> = {
  complete_n_matches: 'MATCHES',
};

function conditionCopy(report: SkinUnlockOutcome | undefined): string {
  if (!report) {
    return '';
  }
  if (report.status === 'revoked') {
    return ' · REVOKED';
  }
  if (report.status === 'condition_not_met') {
    const { condition } = report;
    const label = CONDITION_LABELS[condition.id] ?? condition.id.toUpperCase();
    return ` · ${condition.observed}/${condition.required} ${label}`;
  }
  return '';
}

function SkinRow({
  skin,
  selected,
  owned,
  selecting,
  onSelect,
  unlocking,
  report,
  onUnlock,
}: {
  skin: SkinSummary;
  selected: boolean;
  owned: boolean;
  selecting: boolean;
  onSelect: () => void;
  unlocking: boolean;
  report: SkinUnlockOutcome | undefined;
  onUnlock: () => void;
}) {
  const earnable = skin.entitlement === 'earnable';
  const revoked = report?.status === 'revoked';
  return (
    <View style={styles.row}>
      <View style={styles.rowCopy}>
        <Text style={styles.skinName}>{skin.display_name}</Text>
        <Text style={styles.skinMeta}>
          {skin.status === 'planned' ? 'COMING SOON · ' : ''}
          {skin.entitlement.toUpperCase()}
          {selected ? ' · ACTIVE' : ''}
          {owned ? '' : conditionCopy(report)}
        </Text>
      </View>
      {owned ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`select-skin-${skin.id}`}
          disabled={selected || selecting}
          onPress={onSelect}
          style={[styles.selectButton, selected || selecting ? styles.selectDisabled : null]}
        >
          <Text style={styles.selectButtonText}>{selected ? 'ACTIVE' : 'SELECT'}</Text>
        </Pressable>
      ) : earnable && !revoked ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`unlock-skin-${skin.id}`}
          disabled={unlocking}
          onPress={onUnlock}
          style={[styles.selectButton, unlocking ? styles.selectDisabled : null]}
        >
          <Text style={styles.selectButtonText}>
            {unlocking ? 'UNLOCKING…' : report ? 'CHECK PROGRESS' : 'UNLOCK'}
          </Text>
        </Pressable>
      ) : (
        <Text style={styles.locked}>
          {skin.entitlement === 'iap' ? 'STORE' : revoked ? 'REVOKED' : 'LOCKED'}
        </Text>
      )}
    </View>
  );
}

export default function SkinsScreen() {
  return (
    <AppScreen title="SKINS">
      <SkinsContent />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  tab: {
    borderColor: tokens.border,
    borderWidth: tokens.borderWidth,
    flex: 1,
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: tokens.accent,
  },
  tabText: {
    color: tokens.text,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  row: {
    alignItems: 'center',
    borderColor: tokens.border,
    borderWidth: tokens.borderWidth,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    padding: 8,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  skinName: {
    color: tokens.text,
    fontSize: 15,
    fontWeight: '900',
  },
  skinMeta: {
    color: tokens.muted,
    fontSize: 11,
    letterSpacing: 1,
  },
  selectButton: {
    backgroundColor: tokens.accent,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectDisabled: {
    opacity: 0.5,
  },
  selectButtonText: {
    color: tokens.black,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  locked: {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  error: {
    color: tokens.danger,
    fontSize: 13,
    marginTop: 6,
  },
});
