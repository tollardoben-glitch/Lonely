import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { Button, Chip, ChipRow, Field, Screen, Section, Txt } from '@/components/ui';
import { api } from '@/data/api';
import { INTERESTS } from '@/data/interests';
import { showError } from '@/lib/alert';
import { isPast } from '@/lib/dates';
import { useProfile } from '@/providers/session-provider';

const TIMES = ['10:00', '12:00', '14:00', '16:00', '18:00', '18:30', '19:00', '19:30', '20:00'];
const CAPACITIES = [4, 6, 8, 12, 20];

function upcomingDays(count: number) {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    days.push(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
  }
  return days;
}

export default function NewEventScreen() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const profile = useProfile();
  const days = upcomingDays(21);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [interestId, setInterestId] = useState(profile.interests[0] ?? INTERESTS[0].id);
  const [dayIndex, setDayIndex] = useState(1);
  const [time, setTime] = useState('19:00');
  const [capacity, setCapacity] = useState(8);
  const [busy, setBusy] = useState(false);

  const startsAt = (() => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date(days[dayIndex]);
    d.setHours(h, m, 0, 0);
    return d;
  })();
  const valid = title.trim().length >= 3 && location.trim().length > 0;

  async function submit() {
    if (isPast(startsAt)) {
      showError(new Error('Dieser Zeitpunkt liegt in der Vergangenheit.'));
      return;
    }
    setBusy(true);
    try {
      const id = await api.createEvent({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startsAt: startsAt.toISOString(),
        capacity,
        interestId,
        groupId: groupId ?? null,
      });
      router.replace(`/event/${id}`);
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <Txt variant="secondary">
        Klein anfangen ist völlig okay: Ein Spaziergang, ein Kaffee, ein Spieleabend. Wichtig ist nur, dass es ein
        öffentlicher Ort ist.
      </Txt>
      <Field label="Titel" value={title} onChangeText={setTitle} placeholder="z. B. Sonntagsbrunch & Brettspiele" maxLength={80} />
      <Field label="Ort" value={location} onChangeText={setLocation} placeholder="Café, Park, Adresse…" />
      <Field
        label="Beschreibung"
        value={description}
        onChangeText={setDescription}
        placeholder="Was macht ihr? Was sollte man mitbringen?"
        multiline
      />

      <Section title="Thema">
        <ChipRow>
          {INTERESTS.map((i) => (
            <Chip key={i.id} label={`${i.emoji} ${i.label}`} selected={interestId === i.id} onPress={() => setInterestId(i.id)} />
          ))}
        </ChipRow>
      </Section>

      <Section title="Wann?">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {days.map((d, i) => (
            <Chip
              key={d.toISOString()}
              label={i === 0 ? 'Heute' : i === 1 ? 'Morgen' : d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })}
              selected={dayIndex === i}
              onPress={() => setDayIndex(i)}
            />
          ))}
        </ScrollView>
        <ChipRow>
          {TIMES.map((t) => (
            <Chip key={t} label={t} selected={time === t} onPress={() => setTime(t)} />
          ))}
        </ChipRow>
      </Section>

      <Section title="Wie viele Personen (inkl. dir)?">
        <ChipRow>
          {CAPACITIES.map((c) => (
            <Chip key={c} label={String(c)} selected={capacity === c} onPress={() => setCapacity(c)} />
          ))}
        </ChipRow>
      </Section>

      <Button title="Treffen veröffentlichen" onPress={submit} loading={busy} disabled={!valid} />
    </Screen>
  );
}
