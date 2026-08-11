import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/lib/errors';
import { protectedQueryKey, protectedQueryScope } from '@/lib/protected-queries';
import { useChoonzApi } from '@/providers/api-provider';
import { useAuth } from '@/providers/auth-provider';
import { AppScreen, BodyText, Panel, PanelTitle } from '@/ui/app-screen';
import { tokens } from '@/ui/tokens';

export default function CatalogScreen() {
  const api = useChoonzApi();
  const auth = useAuth();
  const queryScope = protectedQueryScope(auth.status, auth.user?.id);
  const protectedEnabled = queryScope !== null;
  const scope = queryScope ?? 'inactive';
  const catalog = useQuery({
    queryKey: protectedQueryKey(scope, 'catalog'),
    queryFn: () => api.getCatalog(),
    enabled: protectedEnabled,
  });
  const engine = useQuery({
    queryKey: protectedQueryKey(scope, 'catalog', 'engine'),
    queryFn: () => api.getEngine(),
    enabled: protectedEnabled,
  });
  const gels = useQuery({
    queryKey: protectedQueryKey(scope, 'catalog', 'gels'),
    queryFn: () => api.getGels(),
    enabled: protectedEnabled,
  });
  const fighters = useQuery({
    queryKey: protectedQueryKey(scope, 'catalog', 'fighters'),
    queryFn: () => api.getFighters(),
    enabled: protectedEnabled,
  });
  const stages = useQuery({
    queryKey: protectedQueryKey(scope, 'catalog', 'stages'),
    queryFn: () => api.getStages(),
    enabled: protectedEnabled,
  });
  const kits = useQuery({
    queryKey: protectedQueryKey(scope, 'catalog', 'kits'),
    queryFn: () => api.getKits(),
    enabled: protectedEnabled,
  });
  const queries = [catalog, engine, gels, fighters, stages, kits];
  const failed = protectedEnabled ? queries.find((query) => query.isError) : undefined;
  const pending = protectedEnabled && queries.some((query) => query.isPending);

  return (
    <AppScreen title="CATALOG">
      {!protectedEnabled ? (
        <Panel>
          <PanelTitle>AUTHENTICATION REQUIRED</PanelTitle>
          <BodyText>Sign in on Profile to read the live catalog.</BodyText>
        </Panel>
      ) : null}
      {pending ? <BodyText>Loading read-only catalog…</BodyText> : null}
      {failed ? <Text style={styles.failure}>{errorMessage(failed.error)}</Text> : null}

      {catalog.data ? (
        <Panel>
          <PanelTitle>ENGINE INDEX</PanelTitle>
          <BodyText>
            {catalog.data.fighters_count} fighters · {catalog.data.gels_count} gels ·{' '}
            {catalog.data.stages_count} stages · {catalog.data.loop}-step loop
          </BodyText>
          {engine.data ? (
            <BodyText>
              {engine.data.sound_map_status.toUpperCase()} sound map · one-gel law{' '}
              {engine.data.one_gel_law.default_enforce === true ? 'ON' : 'OFF'}
            </BodyText>
          ) : null}
        </Panel>
      ) : null}

      {gels.data ? (
        <Panel>
          <PanelTitle>GELS</PanelTitle>
          <View style={styles.gels}>
            {gels.data.map((gel) => (
              <View key={gel.id} style={[styles.gel, { borderColor: gel.hot, backgroundColor: gel.deep }]}>
                <View style={[styles.swatch, { backgroundColor: gel.hot }]} />
                <Text style={styles.gelName}>{gel.id.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </Panel>
      ) : null}

      {fighters.data ? (
        <Panel>
          <PanelTitle>FIGHTERS</PanelTitle>
          {fighters.data.map((fighter) => (
            <View key={fighter.id} style={styles.entry}>
              <Text style={styles.entryName}>{fighter.display_name}</Text>
              <Text style={styles.entryDetail}>{fighter.title}</Text>
              <Text style={styles.entryDetail}>{fighter.notes}</Text>
            </View>
          ))}
        </Panel>
      ) : null}

      {stages.data ? (
        <Panel>
          <PanelTitle>STAGES</PanelTitle>
          {stages.data.map((stage) => (
            <View key={stage.id} style={styles.entry}>
              <Text style={styles.entryName}>{stage.display_name}</Text>
              <Text style={styles.entryDetail}>
                {stage.status.toUpperCase()} · {stage.default_gel.toUpperCase()} gel · {stage.width}×
                {stage.height}
              </Text>
            </View>
          ))}
        </Panel>
      ) : null}

      {kits.data ? (
        <Panel>
          <PanelTitle>KITS</PanelTitle>
          {kits.data.map((kit) => (
            <View key={kit.fighter_id} style={styles.entry}>
              <Text style={styles.entryName}>
                {kit.display_name} · {kit.archetype.toUpperCase()}
              </Text>
              <Text style={styles.entryDetail}>{kit.moves.map((move) => move.action).join(' / ')}</Text>
            </View>
          ))}
        </Panel>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  failure: {
    color: tokens.danger,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21,
  },
  gels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gel: {
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    gap: 6,
    minWidth: 92,
    padding: 8,
  },
  swatch: {
    borderColor: tokens.black,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    height: 12,
  },
  gelName: {
    color: tokens.text,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  entry: {
    borderTopColor: tokens.border,
    borderTopWidth: tokens.borderWidth,
    gap: 3,
    paddingTop: 8,
  },
  entryName: {
    color: tokens.text,
    fontSize: 15,
    fontWeight: '900',
  },
  entryDetail: {
    color: tokens.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
