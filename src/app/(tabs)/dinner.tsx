import { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Card, Chip, ChipRow, Loading, People, Screen, Section, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { api } from '@/data/api';
import type { DinnerSignup } from '@/data/types';
import { useQuery } from '@/hooks/use-query';
import { confirm, showError } from '@/lib/alert';
import { formatDay, lockedDinnerDate, nextDinnerDate } from '@/lib/dates';
import { useProfile } from '@/providers/session-provider';

const BUDGETS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: '€ günstig' },
  { value: 2, label: '€€ mittel' },
  { value: 3, label: '€€€ gehoben' },
];
const DIETS = ['Alles', 'Vegetarisch', 'Vegan', 'Halal', 'Glutenfrei'];

const STEPS = [
  ['📝', 'Bis Dienstag anmelden', 'Budget und Ernährung angeben – mehr nicht.'],
  ['🧩', 'Mittwoch: Matching', 'Wir stellen Tische mit 4–6 Menschen aus deiner Stadt zusammen.'],
  ['🍝', 'Donnerstag: Dinner', 'Restaurant und Tischgäste erscheinen hier. Einfach hingehen!'],
];

export default function DinnerScreen() {
  const profile = useProfile();
  const openDate = nextDinnerDate();
  const lockedDate = lockedDinnerDate();
  const { data, error, reload, refresh, refreshing } = useQuery(`dinner:${lockedDate}:${openDate}`, async () => {
    const [current, open] = await Promise.all([
      lockedDate ? api.getDinnerSignup(lockedDate) : Promise.resolve(null),
      api.getDinnerSignup(openDate),
    ]);
    return { current, open };
  });

  if (!data) return <Loading error={error} />;

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={{ gap: Spacing.one }}>
        <Txt variant="title">Dinner mit Fremden</Txt>
        <Txt variant="secondary">
          Jeden Donnerstag in {profile.city}. Kein Smalltalk-Marathon in Apps – einfach zusammen essen.
        </Txt>
      </View>

      {data.current && <SignupStatus signup={data.current} onChanged={reload} />}

      {data.open ? (
        <SignupStatus signup={data.open} onChanged={reload} />
      ) : (
        <SignupForm dinnerDate={openDate} onDone={reload} />
      )}

      <Section title="So funktioniert's">
        {STEPS.map(([emoji, title, text]) => (
          <Card key={title}>
            <Txt variant="label">
              {emoji} {title}
            </Txt>
            <Txt variant="secondary">{text}</Txt>
          </Card>
        ))}
      </Section>
    </Screen>
  );
}

function SignupForm({ dinnerDate, onDone }: { dinnerDate: string; onDone: () => void }) {
  const [budget, setBudget] = useState<1 | 2 | 3>(2);
  const [diet, setDiet] = useState('Alles');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api.signUpForDinner({ dinnerDate, budget, diet });
      onDone();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <Badge text="Anmeldung offen" />
      <Txt variant="heading">{formatDay(dinnerDate)}, 19:30 Uhr</Txt>
      <Txt variant="label">Budget</Txt>
      <ChipRow>
        {BUDGETS.map((b) => (
          <Chip key={b.value} label={b.label} selected={budget === b.value} onPress={() => setBudget(b.value)} />
        ))}
      </ChipRow>
      <Txt variant="label">Ernährung</Txt>
      <ChipRow>
        {DIETS.map((d) => (
          <Chip key={d} label={d} selected={diet === d} onPress={() => setDiet(d)} />
        ))}
      </ChipRow>
      <View style={{ height: Spacing.two }} />
      <Button title="Ich bin dabei" onPress={submit} loading={busy} />
    </Card>
  );
}

function SignupStatus({ signup, onChanged }: { signup: DinnerSignup; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const { table } = signup;

  async function cancel() {
    const ok = await confirm(
      'Dinner absagen?',
      table ? 'Dein Tisch rechnet mit dir – bitte sag nur ab, wenn es wirklich nicht anders geht.' : 'Du kannst dich jederzeit wieder anmelden.',
      'Absagen',
    );
    if (!ok) return;
    setBusy(true);
    try {
      await api.cancelDinner(signup.dinnerDate);
      onChanged();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <Badge text={table ? 'Dein Tisch steht 🎉' : 'Angemeldet ✓'} />
      <Txt variant="heading">{formatDay(signup.dinnerDate)}</Txt>
      {table ? (
        <>
          <Txt>
            🍽️ {table.restaurant}
            {table.address ? `, ${table.address}` : ''}
          </Txt>
          <Txt>🕢 {table.time} Uhr</Txt>
          <Txt variant="label">Mit am Tisch</Txt>
          <People people={table.guests} />
          <Txt variant="small">
            Tipp: Stell dich kurz vor und frag nach der besten Sache, die den anderen diese Woche passiert ist.
          </Txt>
        </>
      ) : (
        <Txt variant="secondary">
          Wir stellen am Mittwoch die Tische zusammen. Restaurant und deine Tischgäste erscheinen dann hier.
          {'\n'}Budget: {'€'.repeat(signup.budget)} · Ernährung: {signup.diet}
        </Txt>
      )}
      <Button variant="danger" title="Absagen" onPress={cancel} loading={busy} />
    </Card>
  );
}
