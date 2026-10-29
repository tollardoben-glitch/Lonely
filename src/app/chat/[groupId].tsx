import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Empty, Loading, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { api } from '@/data/api';
import type { Message } from '@/data/types';
import { useQuery } from '@/hooks/use-query';
import { useTheme } from '@/hooks/use-theme';
import { showError } from '@/lib/alert';
import { formatTime } from '@/lib/dates';
import { reportContent } from '@/lib/report';
import { useProfile } from '@/providers/session-provider';

const POLL_MS = 5000;

export default function ChatScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const profile = useProfile();
  const theme = useTheme();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const list = useRef<FlatList<Message>>(null);
  const { data, error, reload } = useQuery(`chat:${groupId}`, () => api.listMessages(groupId));

  useEffect(() => {
    const timer = setInterval(() => void reload(), POLL_MS);
    return () => clearInterval(timer);
  }, [reload]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      await api.postMessage(groupId, body);
      setText('');
      await reload();
    } catch (e) {
      showError(e);
    } finally {
      setSending(false);
    }
  }

  if (!data) return <Loading error={error} />;

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen options={{ title: 'Gruppenchat' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}>
        <FlatList
          ref={list}
          data={data}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two, flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Empty emoji="💬" text="Noch keine Nachrichten. Sag Hallo!" />}
          renderItem={({ item }) => {
            const mine = item.authorId === profile.id;
            return (
              <Pressable
                onLongPress={mine ? undefined : () => reportContent('message', item.id)}
                style={[
                  styles.bubble,
                  mine
                    ? { alignSelf: 'flex-end', backgroundColor: theme.primary }
                    : { alignSelf: 'flex-start', backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 },
                ]}>
                {!mine && (
                  <Txt variant="small" style={{ fontWeight: '700' }}>
                    {item.authorEmoji} {item.authorName}
                  </Txt>
                )}
                <Text style={{ color: mine ? theme.primaryText : theme.text, fontSize: 16 }}>{item.body}</Text>
                <Text style={{ color: mine ? theme.primaryText : theme.textSecondary, fontSize: 11, opacity: 0.8, alignSelf: 'flex-end' }}>
                  {formatTime(item.createdAt)}
                </Text>
              </Pressable>
            );
          }}
        />
        <View style={[styles.composer, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nachricht schreiben…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
            multiline
            maxLength={1000}
          />
          <Pressable
            onPress={send}
            disabled={sending || !text.trim()}
            style={[styles.send, { backgroundColor: theme.primary, opacity: sending || !text.trim() ? 0.5 : 1 }]}>
            <Text style={{ color: theme.primaryText, fontWeight: '800' }}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '80%', borderRadius: Radius.medium, paddingVertical: 8, paddingHorizontal: 12, gap: 2 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    padding: Spacing.two,
    borderTopWidth: 1,
  },
  input: { flex: 1, borderRadius: Radius.medium, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, maxHeight: 120 },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
