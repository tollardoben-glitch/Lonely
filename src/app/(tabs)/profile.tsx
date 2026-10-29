import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, Card, Chip, ChipRow, Screen, Section, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { interestById } from '@/data/interests';
import { confirm } from '@/lib/alert';
import { isDemoMode } from '@/lib/supabase';
import { useProfile, useSession } from '@/providers/session-provider';

const SAFETY_TIPS = [
  'Triff neue Leute zuerst an öffentlichen Orten.',
  'Sag einer Vertrauensperson, wohin du gehst.',
  'Du schuldest niemandem etwas – geh, wenn du dich unwohl fühlst.',
  'Melde unangemessenes Verhalten direkt in der App.',
];

export default function ProfileScreen() {
  const profile = useProfile();
  const { signOut } = useSession();

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: Spacing.one }}>
        <Text style={{ fontSize: 64 }}>{profile.avatarEmoji}</Text>
        <Txt variant="title">{profile.name}</Txt>
        <Txt variant="secondary">📍 {profile.city}</Txt>
      </View>

      {profile.bio ? (
        <Card>
          <Txt>{profile.bio}</Txt>
        </Card>
      ) : null}

      <Section title="Interessen">
        <ChipRow>
          {profile.interests.map((id) => {
            const i = interestById(id);
            return <Chip key={id} label={`${i.emoji} ${i.label}`} selected={false} onPress={() => router.push('/profile-edit')} />;
          })}
        </ChipRow>
      </Section>

      <Button variant="secondary" title="Profil bearbeiten" onPress={() => router.push('/profile-edit')} />

      <Section title="Sicher treffen 🛡️">
        <Card>
          {SAFETY_TIPS.map((tip) => (
            <Txt key={tip} variant="secondary">
              • {tip}
            </Txt>
          ))}
        </Card>
      </Section>

      {isDemoMode && (
        <Txt variant="small" style={{ textAlign: 'center' }}>
          Demo-Modus – verbinde Supabase, um echte Daten zu nutzen (siehe README).
        </Txt>
      )}

      <Button
        variant="danger"
        title="Abmelden"
        onPress={async () => {
          if (await confirm('Abmelden?', 'Du kannst dich jederzeit wieder anmelden.', 'Abmelden')) await signOut();
        }}
      />
    </Screen>
  );
}
