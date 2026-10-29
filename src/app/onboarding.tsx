import { ProfileForm } from '@/components/profile-form';
import { Screen, Txt } from '@/components/ui';
import { api } from '@/data/api';
import { showError } from '@/lib/alert';
import { useSession } from '@/providers/session-provider';

export default function OnboardingScreen() {
  const { userId, refreshProfile } = useSession();

  return (
    <Screen edges={['top', 'bottom']}>
      <Txt variant="title">Schön, dass du da bist 👋</Txt>
      <Txt variant="secondary">Erzähl uns kurz von dir, damit wir dir Menschen und Treffen in deiner Nähe zeigen können.</Txt>
      <ProfileForm
        requireGuidelines
        submitLabel="Los geht's"
        initial={{ id: userId ?? '', name: '', city: '', bio: '', interests: [], avatarEmoji: '🙂' }}
        onSubmit={async (profile) => {
          try {
            await api.saveProfile(profile);
            await refreshProfile();
          } catch (e) {
            showError(e);
          }
        }}
      />
    </Screen>
  );
}
