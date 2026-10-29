import { Alert, Platform } from 'react-native';

import { api } from '@/data/api';
import type { ReportTarget } from '@/data/types';

import { showError, showInfo } from './alert';

const REASONS = ['Unangemessenes Verhalten', 'Belästigung', 'Spam oder Fake'];

async function send(target: ReportTarget, id: string, reason: string) {
  try {
    await api.report(target, id, reason);
    showInfo('Danke für deine Meldung', 'Unser Team schaut sich das an. Deine Sicherheit geht vor.');
  } catch (e) {
    showError(e);
  }
}

export function reportContent(target: ReportTarget, id: string) {
  if (Platform.OS === 'web') {
    const reason = window.prompt(`Warum möchtest du das melden?\n(${REASONS.join(', ')})`);
    if (reason) void send(target, id, reason);
    return;
  }
  Alert.alert('Melden', 'Warum möchtest du das melden?', [
    ...REASONS.map((reason) => ({ text: reason, onPress: () => void send(target, id, reason) })),
    { text: 'Abbrechen', style: 'cancel' as const },
  ]);
}
