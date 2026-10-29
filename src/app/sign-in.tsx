import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Field, Screen, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { api } from '@/data/api';
import { showError, showInfo } from '@/lib/alert';
import { isDemoMode } from '@/lib/supabase';

export default function SignInScreen() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signUp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 8;

  async function submit() {
    setBusy(true);
    try {
      if (mode === 'signIn') {
        await api.signIn(email, password);
      } else {
        const { needsConfirmation } = await api.signUp(email, password);
        if (needsConfirmation) {
          showInfo('Fast geschafft', 'Bitte bestätige deine E-Mail-Adresse über den Link, den wir dir geschickt haben.');
          setMode('signIn');
        }
      }
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen edges={['top', 'bottom']}>
        <View style={styles.hero}>
          <Text style={styles.logo}>🫶</Text>
          <Txt variant="title" style={{ textAlign: 'center' }}>
            Zusammen
          </Txt>
          <Txt variant="secondary" style={{ textAlign: 'center' }}>
            Echte Menschen. Echte Treffen.{'\n'}Dinner mit Fremden, Hobby-Gruppen und Events in deiner Stadt.
          </Txt>
        </View>

        <Card>
          <Field
            label="E-Mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="du@beispiel.de"
          />
          <Field
            label="Passwort"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            placeholder="Mindestens 8 Zeichen"
          />
          <View style={{ height: Spacing.two }} />
          <Button
            title={mode === 'signIn' ? 'Anmelden' : 'Konto erstellen'}
            onPress={submit}
            loading={busy}
            disabled={!valid}
          />
          <Button
            variant="secondary"
            title={mode === 'signIn' ? 'Neu hier? Konto erstellen' : 'Ich habe schon ein Konto'}
            onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          />
        </Card>

        {isDemoMode && (
          <Txt variant="small" style={{ textAlign: 'center' }}>
            Demo-Modus: Es ist noch kein Backend verbunden. Gib eine beliebige E-Mail und ein Passwort ein –
            alle Inhalte sind Beispieldaten und werden beim Neustart zurückgesetzt.
          </Txt>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.five },
  logo: { fontSize: 64 },
});
