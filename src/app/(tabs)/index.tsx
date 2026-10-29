import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { EventCard } from '@/components/cards';
import { Button, Card, Chip, ChipRow, Empty, Loading, Screen, Section, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { api } from '@/data/api';
import { interestById } from '@/data/interests';
import { useQuery } from '@/hooks/use-query';
import { formatDay, nextDinnerDate } from '@/lib/dates';
import { useProfile } from '@/providers/session-provider';

export default function DiscoverScreen() {
  const profile = useProfile();
  const [filter, setFilter] = useState<string | null>(null);
  const { data, error, refresh, refreshing } = useQuery(`events:${profile.city}`, () => api.listEvents(profile.city));

  if (!data) return <Loading error={error} />;

  const mine = data.filter((e) => e.isAttending);
  const others = data.filter((e) => !e.isAttending);
  const forYou = others.filter((e) => profile.interests.includes(e.interestId));
  const filtered = filter ? others.filter((e) => e.interestId === filter) : others;
  const usedInterests = [...new Set(others.map((e) => e.interestId))];

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <View style={{ gap: Spacing.one }}>
        <Txt variant="title">Hallo {profile.name} {profile.avatarEmoji}</Txt>
        <Txt variant="secondary">Was passiert diese Woche in {profile.city}?</Txt>
      </View>

      <Card onPress={() => router.navigate('/dinner')}>
        <Txt variant="heading">🍽️ Dinner mit Fremden</Txt>
        <Txt variant="secondary">
          {formatDay(nextDinnerDate())}: Wir setzen dich mit 3–5 netten Menschen an einen Tisch. Jetzt anmelden →
        </Txt>
      </Card>

      {mine.length > 0 && (
        <Section title="Deine nächsten Treffen">
          {mine.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </Section>
      )}

      {forYou.length > 0 && !filter && (
        <Section title="Passt zu dir ✨">
          {forYou.slice(0, 3).map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </Section>
      )}

      <Section
        title="Alle Treffen"
        action={<Txt variant="label" style={{ opacity: 0.8 }} onPress={() => router.push('/event/new')}>＋ Erstellen</Txt>}>
        {usedInterests.length > 1 && (
          <ChipRow>
            <Chip label="Alle" selected={!filter} onPress={() => setFilter(null)} />
            {usedInterests.map((id) => {
              const i = interestById(id);
              return <Chip key={id} label={`${i.emoji} ${i.label}`} selected={filter === id} onPress={() => setFilter(id)} />;
            })}
          </ChipRow>
        )}
        {filtered.length === 0 ? (
          <Empty emoji="🌱" text={`Noch keine Treffen in ${profile.city}. Starte doch das erste!`} />
        ) : (
          filtered.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </Section>

      <Button variant="secondary" title="Eigenes Treffen erstellen" onPress={() => router.push('/event/new')} />
    </Screen>
  );
}
