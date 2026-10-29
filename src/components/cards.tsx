import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { interestById } from '@/data/interests';
import type { EventItem, Group } from '@/data/types';
import { formatEventDate } from '@/lib/dates';

import { Badge, Card, Txt } from './ui';

export function EventCard({ event }: { event: EventItem }) {
  const interest = interestById(event.interestId);
  const spotsLeft = event.capacity - event.attendeeCount;
  return (
    <Card onPress={() => router.push(`/event/${event.id}`)}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{interest.emoji}</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="small">{formatEventDate(event.startsAt)}</Txt>
          <Txt variant="heading">{event.title}</Txt>
          <Txt variant="secondary" numberOfLines={1}>
            📍 {event.location}
          </Txt>
        </View>
      </View>
      <View style={styles.row}>
        {event.isAttending ? (
          <Badge text="Du bist dabei ✓" />
        ) : (
          <Badge text={spotsLeft > 0 ? `Noch ${spotsLeft} ${spotsLeft === 1 ? 'Platz' : 'Plätze'}` : 'Ausgebucht'} />
        )}
        {event.groupName && <Txt variant="small">· {event.groupName}</Txt>}
      </View>
    </Card>
  );
}

export function GroupCard({ group }: { group: Group }) {
  return (
    <Card onPress={() => router.push(`/group/${group.id}`)}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{group.emoji}</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading">{group.name}</Txt>
          <Txt variant="secondary" numberOfLines={2}>
            {group.description}
          </Txt>
          <Txt variant="small">
            {group.memberCount} {group.memberCount === 1 ? 'Mitglied' : 'Mitglieder'}
            {group.isMember ? ' · Du bist Mitglied' : ''}
          </Txt>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  emoji: { fontSize: 34 },
});
