import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { EventCard } from '@/components/cards';
import { Button, Card, Empty, Loading, People, Screen, Section, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { api } from '@/data/api';
import { useQuery } from '@/hooks/use-query';
import { confirm, showError } from '@/lib/alert';
import { reportContent } from '@/lib/report';

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [busy, setBusy] = useState(false);
  const { data, error, reload, refresh, refreshing } = useQuery(`group:${id}`, () => api.getGroup(id));

  if (!data) return <Loading error={error} />;
  const { group, members, events } = data;

  async function toggle() {
    if (group.isMember && !(await confirm('Gruppe verlassen?', 'Du kannst jederzeit wieder beitreten.', 'Verlassen'))) {
      return;
    }
    setBusy(true);
    try {
      await api.setMembership(group.id, !group.isMember);
      await reload();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']} onRefresh={refresh} refreshing={refreshing}>
      <Stack.Screen options={{ title: group.name }} />
      <View style={{ gap: Spacing.two, alignItems: 'center' }}>
        <Text style={{ fontSize: 56 }}>{group.emoji}</Text>
        <Txt variant="title" style={{ textAlign: 'center' }}>
          {group.name}
        </Txt>
        <Txt variant="secondary" style={{ textAlign: 'center' }}>
          {group.description}
        </Txt>
        <Txt variant="small">
          📍 {group.city} · {group.memberCount} {group.memberCount === 1 ? 'Mitglied' : 'Mitglieder'}
        </Txt>
      </View>

      {group.isMember ? (
        <View style={{ gap: Spacing.two }}>
          <Button title="💬 Zum Gruppenchat" onPress={() => router.push(`/chat/${group.id}`)} />
          <Button
            variant="secondary"
            title="Treffen für die Gruppe planen"
            onPress={() => router.push({ pathname: '/event/new', params: { groupId: group.id } })}
          />
        </View>
      ) : (
        <Button title="Gruppe beitreten" onPress={toggle} loading={busy} />
      )}

      <Section title="Nächste Treffen">
        {events.length === 0 ? (
          <Empty emoji="📅" text="Noch nichts geplant. Schlag doch ein Treffen vor!" />
        ) : (
          events.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </Section>

      <Section title="Mitglieder">
        <Card>
          <People people={members} max={30} />
        </Card>
      </Section>

      {group.isMember && <Button variant="danger" title="Gruppe verlassen" onPress={toggle} loading={busy} />}

      <Txt variant="small" style={{ textAlign: 'center' }} onPress={() => reportContent('group', group.id)}>
        Gruppe melden
      </Txt>
    </Screen>
  );
}
