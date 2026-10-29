import { router } from 'expo-router';
import { useState } from 'react';

import { Button, Chip, ChipRow, Field, Screen, Section, Txt } from '@/components/ui';
import { api } from '@/data/api';
import { INTERESTS, interestById } from '@/data/interests';
import { showError } from '@/lib/alert';
import { useProfile } from '@/providers/session-provider';

export default function NewGroupScreen() {
  const profile = useProfile();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [interestId, setInterestId] = useState(profile.interests[0] ?? INTERESTS[0].id);
  const [busy, setBusy] = useState(false);

  const valid = name.trim().length >= 3 && description.trim().length > 0;

  async function submit() {
    setBusy(true);
    try {
      const id = await api.createGroup({
        name: name.trim(),
        description: description.trim(),
        interestId,
        emoji: interestById(interestId).emoji,
      });
      router.replace(`/group/${id}`);
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <Txt variant="secondary">
        Gruppen leben von Regelmäßigkeit: Ein fester Rhythmus (z. B. jeden ersten Sonntag) hilft, dass aus Fremden
        Freunde werden.
      </Txt>
      <Field label="Name" value={name} onChangeText={setName} placeholder="z. B. Laufgruppe Tempelhof" maxLength={60} />
      <Field
        label="Worum geht's?"
        value={description}
        onChangeText={setDescription}
        placeholder="Wer ist willkommen? Wie oft trefft ihr euch?"
        multiline
      />
      <Section title="Thema">
        <ChipRow>
          {INTERESTS.map((i) => (
            <Chip key={i.id} label={`${i.emoji} ${i.label}`} selected={interestId === i.id} onPress={() => setInterestId(i.id)} />
          ))}
        </ChipRow>
      </Section>
      <Button title={`Gruppe in ${profile.city} gründen`} onPress={submit} loading={busy} disabled={!valid} />
    </Screen>
  );
}
