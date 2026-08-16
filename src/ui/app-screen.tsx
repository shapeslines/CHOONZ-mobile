import { Link, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fixtureDataLabel } from '@/lib/config';
import { useSkins } from '@/providers/skin-provider';
import { useRuntimeConfig } from '@/providers/runtime-config-provider';
import { tokens } from '@/ui/tokens';

/**
 * The app shell. Surface colors (background, header border, wordmark, nav)
 * resolve from the active ui_theme skin via the SkinProvider (M-S2); the
 * default skin equals the static tokens, so nothing changes until a user
 * selects a different gel theme.
 */
export function AppScreen({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const config = useRuntimeConfig();
  const { theme } = useSkins();
  const label = fixtureDataLabel(config);
  const themed = useMemo(
    () => ({
      safeArea: { flex: 1, backgroundColor: theme.background },
      header: {
        borderBottomColor: theme.border,
        borderBottomWidth: theme.borderWidth,
        paddingHorizontal: theme.space,
        paddingVertical: theme.space,
      },
      wordmark: { color: theme.accent, fontSize: 13, fontWeight: '900' as const, letterSpacing: 2 },
      title: { color: theme.text, fontSize: 28, fontWeight: '900' as const, letterSpacing: 1 },
      nav: {
        borderTopColor: theme.border,
        borderTopWidth: theme.borderWidth,
        flexDirection: 'row' as const,
        gap: 6,
        padding: 8,
      },
      navButton: {
        backgroundColor: theme.panelStrong,
        borderColor: theme.border,
        borderRadius: theme.radius,
        borderWidth: theme.borderWidth,
        flex: 1,
        paddingVertical: 10,
      },
      navText: { color: theme.text, fontSize: 11, fontWeight: '900' as const, letterSpacing: 1, textAlign: 'center' as const },
    }),
    [theme],
  );

  return (
    <SafeAreaView style={themed.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={themed.header}>
        <Text style={themed.wordmark}>CHOONZ</Text>
        <Text style={themed.title}>{title}</Text>
      </View>
      {label ? (
        <View accessibilityLabel="fixture-data-label" style={styles.fixtureLabel}>
          <Text style={styles.fixtureText}>{label}</Text>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      <View style={themed.nav}>
        <NavButton href="/" label="STATUS" style={themed.navButton} textStyle={themed.navText} />
        <NavButton href="/catalog" label="CATALOG" style={themed.navButton} textStyle={themed.navText} />
        <NavButton href="/skins" label="SKINS" style={themed.navButton} textStyle={themed.navText} />
        <NavButton href="/fight" label="FIGHT" style={themed.navButton} textStyle={themed.navText} />
        <NavButton href="/profile" label="PROFILE" style={themed.navButton} textStyle={themed.navText} />
      </View>
    </SafeAreaView>
  );
}

function NavButton({
  href,
  label,
  style,
  textStyle,
}: {
  href: Href;
  label: string;
  style: object;
  textStyle: object;
}) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityLabel={label} style={style}>
        <Text style={textStyle}>{label}</Text>
      </Pressable>
    </Link>
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
});
