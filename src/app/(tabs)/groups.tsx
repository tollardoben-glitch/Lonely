import { router } from 'expo-router';

import { GroupCard } from '@/components/cards';
import { Button, Empty, Loading, Screen, Section, Txt } from '@/components/ui';
import { api } from '@/data/api';
import { useQuery } from '@/hooks/use-query';
import { useProfile } from '@/providers/session-provider';

export default function GroupsScreen() {
  const profile = useProfile();
  const { data, error, refresh, refreshing } = useQuery(`groups:${profile.city}`, () => api.listGroups(profile.city));

  if (!data) return <Loading error={error} />;

  const mine = data.filter((g) => g.isMember);
  const suggested = data
    .filter((g) => !g.isMember)
    .sort((a, b) => Number(profile.interests.includes(b.interestId)) - Number(profile.interests.includes(a.interestId)));

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <Txt variant="secondary">
        Hobby-Clubs in {profile.city}: regelmäßige Treffen mit denselben Leuten – so entstehen Freundschaften.
      </Txt>

      {mine.length > 0 && (
        <Section title="Meine Gruppen">
          {mine.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </Section>
      )}

      <Section title="Gruppen entdecken">
        {suggested.length === 0 ? (
          <Empty emoji="👋" text="Hier gibt es noch keine weiteren Gruppen. Gründe die erste!" />
        ) : (
          suggested.map((g) => <GroupCard key={g.id} group={g} />)
        )}
      </Section>

      <Button variant="secondary" title="Neue Gruppe gründen" onPress={() => router.push('/group/new')} />
    </Screen>
  );
}
