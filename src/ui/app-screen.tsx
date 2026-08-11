import { Link, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fixtureDataLabel } from '@/lib/config';
import { useRuntimeConfig } from '@/providers/runtime-config-provider';
import { tokens } from '@/ui/tokens';

function NavButton({ href, label }: { href: Href; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.navButton}>
        <Text style={styles.navText}>{label}</Text>
      </Pressable>
    </Link>
  );
}

export function AppScreen({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const config = useRuntimeConfig();
  const label = fixtureDataLabel(config);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.wordmark}>CHOONZ</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      {label ? (
        <View accessibilityLabel="fixture-data-label" style={styles.fixtureLabel}>
          <Text style={styles.fixtureText}>{label}</Text>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      <View style={styles.nav}>
        <NavButton href="/" label="STATUS" />
        <NavButton href="/catalog" label="CATALOG" />
        <NavButton href="/fight" label="FIGHT" />
        <NavButton href="/profile" label="PROFILE" />
      </View>
    </SafeAreaView>
  );
}

export function Panel({ children }: { children: React.ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}

export function PanelTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.panelTitle}>{children}</Text>;
}

export function BodyText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.background,
  },
  header: {
    borderBottomColor: tokens.border,
    borderBottomWidth: tokens.borderWidth,
    paddingHorizontal: tokens.space,
    paddingVertical: tokens.space,
  },
  wordmark: {
    color: tokens.accent,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    color: tokens.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  fixtureLabel: {
    backgroundColor: tokens.accent,
    borderBottomColor: tokens.black,
    borderBottomWidth: tokens.borderWidth,
    paddingHorizontal: tokens.space,
    paddingVertical: 7,
  },
  fixtureText: {
    color: tokens.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  content: {
    gap: tokens.space,
    padding: tokens.space,
  },
  panel: {
    backgroundColor: tokens.panel,
    borderColor: tokens.border,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    gap: 8,
    padding: tokens.space,
  },
  panelTitle: {
    color: tokens.accent,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  body: {
    color: tokens.text,
    fontSize: 15,
    lineHeight: 22,
  },
  nav: {
    borderTopColor: tokens.border,
    borderTopWidth: tokens.borderWidth,
    flexDirection: 'row',
    gap: 6,
    padding: 8,
  },
  navButton: {
    backgroundColor: tokens.panelStrong,
    borderColor: tokens.border,
    borderRadius: tokens.radius,
    borderWidth: tokens.borderWidth,
    flex: 1,
    paddingVertical: 10,
  },
  navText: {
    color: tokens.text,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
