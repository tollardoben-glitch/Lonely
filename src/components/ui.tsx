import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import type { Person } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';

type TextVariant = 'title' | 'heading' | 'body' | 'secondary' | 'small' | 'label';

export function Txt({ variant = 'body', style, ...rest }: TextProps & { variant?: TextVariant }) {
  const theme = useTheme();
  const color = variant === 'secondary' || variant === 'small' ? theme.textSecondary : theme.text;
  return <Text style={[{ color }, textStyles[variant], style]} {...rest} />;
}

export function Screen({
  children,
  onRefresh,
  refreshing = false,
  edges = [],
  footer,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          ) : undefined
        }>
        {children}
      </ScrollView>
      {footer}
    </SafeAreaView>
  );
}

export function Card({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const cardStyle = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style];
  if (!onPress) return <View style={cardStyle}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const background =
    variant === 'primary' ? theme.primary : variant === 'secondary' ? theme.primarySoft : 'transparent';
  const color = variant === 'primary' ? theme.primaryText : variant === 'danger' ? theme.danger : theme.primary;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background },
        variant === 'danger' && { borderWidth: 1, borderColor: theme.danger },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[styles.buttonText, { color }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.card,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}>
      <Text style={{ color: selected ? theme.primaryText : theme.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: Spacing.one }}>
      <Txt variant="label">{label}</Txt>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        {...props}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.card, borderColor: theme.border },
          props.multiline && { minHeight: 90, textAlignVertical: 'top' },
          props.style,
        ]}
      />
    </View>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: Spacing.two }}>
      <View style={styles.sectionHeader}>
        <Txt variant="heading">{title}</Txt>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Empty({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 40 }}>{emoji}</Text>
      <Txt variant="secondary" style={{ textAlign: 'center' }}>
        {text}
      </Txt>
    </View>
  );
}

export function Loading({ error }: { error?: string | null }) {
  const theme = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      {error ? <Txt variant="secondary">{error}</Txt> : <ActivityIndicator color={theme.primary} />}
    </View>
  );
}

export function People({ people, max = 8 }: { people: Person[]; max?: number }) {
  const theme = useTheme();
  const shown = people.slice(0, max);
  return (
    <View style={styles.chipRow}>
      {shown.map((p) => (
        <View key={p.id} style={[styles.person, { backgroundColor: theme.primarySoft }]}>
          <Text>{p.avatarEmoji}</Text>
          <Txt variant="small" style={{ color: theme.text }}>
            {p.name}
          </Txt>
        </View>
      ))}
      {people.length > max && <Txt variant="small">+{people.length - max} weitere</Txt>}
    </View>
  );
}

export function Badge({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
      <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 12 }}>{text}</Text>
    </View>
  );
}

const textStyles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', lineHeight: 36 },
  heading: { fontSize: 19, fontWeight: '700', lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 23 },
  secondary: { fontSize: 15, lineHeight: 21 },
  small: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '700' },
});

const styles = StyleSheet.create({
  screenContent: { padding: Spacing.three, gap: Spacing.four, paddingBottom: Spacing.five * 2 },
  card: { borderWidth: 1, borderRadius: Radius.medium, padding: Spacing.three, gap: Spacing.two },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
  button: {
    borderRadius: Radius.pill,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  input: {
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  badge: { borderRadius: Radius.pill, paddingVertical: 3, paddingHorizontal: 10, alignSelf: 'flex-start' },
});
