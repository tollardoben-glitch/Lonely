import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Badge, Button, Card, Loading, People, Screen, Section, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { api } from '@/data/api';
import { interestById } from '@/data/interests';
import { useQuery } from '@/hooks/use-query';
import { confirm, showError } from '@/lib/alert';
import { formatEventDate } from '@/lib/dates';
import { reportContent } from '@/lib/report';
import { useProfile } from '@/providers/session-provider';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfile();
  const [busy, setBusy] = useState(false);
  const { data, error, reload, refresh, refreshing } = useQuery(`event:${id}`, () => api.getEvent(id));

  if (!data) return <Loading error={error} />;
  const { event, attendees } = data;
  const interest = interestById(event.interestId);
  const full = event.attendeeCount >= event.capacity;
  const isHost = event.hostId === profile.id;

  async function toggle() {
    if (event.isAttending && !(await confirm('Absagen?', 'Die anderen freuen sich, wenn du Bescheid gibst.', 'Absagen'))) {
      return;
    }
    setBusy(true);
    try {
      await api.setAttending(event.id, !event.isAttending);
      await reload();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      edges={['bottom']}
      onRefresh={refresh}
      refreshing={refreshing}
      footer={
        <View style={{ padding: Spacing.three }}>
          {isHost ? (
            <Badge text="Du organisierst dieses Treffen" />
          ) : (
            <Button
              title={event.isAttending ? 'Doch nicht dabei' : full ? 'Leider ausgebucht' : 'Ich bin dabei'}
              variant={event.isAttending ? 'danger' : 'primary'}
              disabled={!event.isAttending && full}
              loading={busy}
              onPress={toggle}
            />
          )}
        </View>
      }>
      <Stack.Screen options={{ title: interest.label }} />
      <View style={{ gap: Spacing.two }}>
        <Text style={{ fontSize: 48 }}>{interest.emoji}</Text>
        <Txt variant="title">{event.title}</Txt>
        <Txt variant="secondary">🗓️ {formatEventDate(event.startsAt)}</Txt>
        <Txt variant="secondary">📍 {event.location}</Txt>
        <Txt variant="secondary">🙋 Organisiert von {event.hostName}</Txt>
      </View>

      {event.groupId && event.groupName && (
        <Card onPress={() => router.push(`/group/${event.groupId}`)}>
          <Txt variant="label">Teil der Gruppe „{event.groupName}“ →</Txt>
        </Card>
      )}

      {event.description ? <Txt>{event.description}</Txt> : null}

      <Section title={`Dabei (${event.attendeeCount}/${event.capacity})`}>
        {attendees.length > 0 ? <People people={attendees} max={20} /> : <Txt variant="secondary">Sei die erste Person!</Txt>}
      </Section>

      <Txt variant="small" style={{ textAlign: 'center' }} onPress={() => reportContent('event', event.id)}>
        Treffen melden
      </Txt>
    </Screen>
  );
}
