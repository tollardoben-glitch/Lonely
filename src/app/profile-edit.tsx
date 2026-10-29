import { router } from 'expo-router';

import { ProfileForm } from '@/components/profile-form';
import { Screen } from '@/components/ui';
import { api } from '@/data/api';
import { showError } from '@/lib/alert';
import { useProfile, useSession } from '@/providers/session-provider';

export default function ProfileEditScreen() {
  const profile = useProfile();
  const { refreshProfile } = useSession();

  return (
    <Screen edges={['bottom']}>
      <ProfileForm
        initial={profile}
        submitLabel="Speichern"
        onSubmit={async (updated) => {
          try {
            await api.saveProfile(updated);
            await refreshProfile();
            router.back();
          } catch (e) {
            showError(e);
          }
        }}
      />
    </Screen>
  );
}
