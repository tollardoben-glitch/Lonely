import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { AVATARS, CITIES, INTERESTS } from '@/data/interests';
import type { Profile } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';

import { Button, Chip, ChipRow, Field, Section, Txt } from './ui';

export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
  requireGuidelines = false,
}: {
  initial: Profile;
  submitLabel: string;
  onSubmit: (profile: Profile) => Promise<void>;
  requireGuidelines?: boolean;
}) {
  const theme = useTheme();
  const [name, setName] = useState(initial.name);
  const [city, setCity] = useState(initial.city);
  const [bio, setBio] = useState(initial.bio);
  const [interests, setInterests] = useState<string[]>(initial.interests);
  const [avatarEmoji, setAvatarEmoji] = useState(initial.avatarEmoji);
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(!requireGuidelines);
  const [busy, setBusy] = useState(false);

  const toggleInterest = (id: string) =>
    setInterests((list) => (list.includes(id) ? list.filter((i) => i !== id) : [...list, id]));

  const valid = name.trim().length > 0 && city.trim().length > 0 && interests.length >= 3 && acceptedGuidelines;

  async function submit() {
    setBusy(true);
    try {
      await onSubmit({ ...initial, name: name.trim(), city: city.trim(), bio: bio.trim(), interests, avatarEmoji });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: Spacing.four }}>
      <Section title="Dein Avatar">
        <View style={styles.avatars}>
          {AVATARS.map((a) => (
            <Pressable
              key={a}
              onPress={() => setAvatarEmoji(a)}
              style={[
                styles.avatar,
                { borderColor: a === avatarEmoji ? theme.primary : theme.border, backgroundColor: theme.card },
              ]}>
              <Text style={{ fontSize: 26 }}>{a}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Field label="Vorname" value={name} onChangeText={setName} placeholder="Wie sollen dich andere nennen?" maxLength={40} />

      <Section title="Deine Stadt">
        <ChipRow>
          {CITIES.map((c) => (
            <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />
          ))}
        </ChipRow>
        <Field label="Andere Stadt" value={CITIES.includes(city) ? '' : city} onChangeText={setCity} placeholder="z. B. Dresden" />
      </Section>

      <Section title="Was machst du gern?">
        <Txt variant="secondary">Wähle mindestens 3 – damit finden wir passende Menschen und Treffen für dich.</Txt>
        <ChipRow>
          {INTERESTS.map((i) => (
            <Chip
              key={i.id}
              label={`${i.emoji} ${i.label}`}
              selected={interests.includes(i.id)}
              onPress={() => toggleInterest(i.id)}
            />
          ))}
        </ChipRow>
      </Section>

      <Field
        label="Über dich (optional)"
        value={bio}
        onChangeText={setBio}
        placeholder="Neu in der Stadt? Lieblingsessen? Worüber redest du stundenlang?"
        multiline
        maxLength={300}
      />

      {requireGuidelines && (
        <Pressable onPress={() => setAcceptedGuidelines(!acceptedGuidelines)} style={styles.guidelines}>
          <Text style={{ fontSize: 22 }}>{acceptedGuidelines ? '☑️' : '⬜️'}</Text>
          <Txt variant="secondary" style={{ flex: 1 }}>
            Ich bin respektvoll, erscheine zu Treffen, für die ich zusage, und treffe Fremde zuerst an öffentlichen
            Orten. Belästigung wird nicht toleriert.
          </Txt>
        </Pressable>
      )}

      <Button title={submitLabel} onPress={submit} loading={busy} disabled={!valid} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidelines: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
});
