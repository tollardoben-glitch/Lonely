import { supabase } from '@/lib/supabase';

import type { Api } from './api';
import type { EventItem, Group, Person, Profile } from './types';

type ProfileRow = {
  id: string;
  name: string;
  city: string;
  bio: string;
  interests: string[];
  avatar_emoji: string;
};

type EventRow = {
  id: string;
  title: string;
  description: string;
  city: string;
  location: string;
  starts_at: string;
  capacity: number;
  interest_id: string;
  host_id: string | null;
  group_id: string | null;
  host: { name: string } | null;
  group: { name: string } | null;
  event_attendees: { count: number }[];
};

type GroupRow = {
  id: string;
  name: string;
  description: string;
  city: string;
  interest_id: string;
  emoji: string;
  group_members: { count: number }[];
};

const EVENT_SELECT =
  '*, host:profiles!events_host_id_fkey(name), group:groups(name), event_attendees(count)';
const GROUP_SELECT = '*, group_members(count)';

function client() {
  if (!supabase) throw new Error('Supabase ist nicht konfiguriert');
  return supabase;
}

type Result<T> = { data: T; error: { message: string } | null };

/** Returns the data of a query that may legitimately be empty (mutations, maybeSingle). */
function ok<T>(result: Result<T>): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

/** Returns the data of a query that must produce a result. */
function must<T>(result: Result<T>): NonNullable<T> {
  const data = ok(result);
  if (data == null) throw new Error('Nicht gefunden');
  return data;
}

async function requireUserId(): Promise<string> {
  const { data } = await client().auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Nicht angemeldet');
  return id;
}

const toPerson = (p: Pick<ProfileRow, 'id' | 'name' | 'avatar_emoji'>): Person => ({
  id: p.id,
  name: p.name,
  avatarEmoji: p.avatar_emoji,
});

function toEvent(row: EventRow, attending: Set<string>): EventItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    city: row.city,
    location: row.location,
    startsAt: row.starts_at,
    capacity: row.capacity,
    interestId: row.interest_id,
    attendeeCount: row.event_attendees[0]?.count ?? 0,
    isAttending: attending.has(row.id),
    hostId: row.host_id,
    hostName: row.host?.name ?? 'Zusammen-Team',
    groupId: row.group_id,
    groupName: row.group?.name ?? null,
  };
}

function toGroup(row: GroupRow, memberOf: Set<string>): Group {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    city: row.city,
    interestId: row.interest_id,
    emoji: row.emoji,
    memberCount: row.group_members[0]?.count ?? 0,
    isMember: memberOf.has(row.id),
  };
}

async function myAttendance(eventIds: string[]): Promise<Set<string>> {
  if (eventIds.length === 0) return new Set();
  const uid = await requireUserId();
  const rows = must(
    await client().from('event_attendees').select('event_id').eq('user_id', uid).in('event_id', eventIds),
  );
  return new Set(rows.map((r) => r.event_id as string));
}

async function myGroups(): Promise<Set<string>> {
  const uid = await requireUserId();
  const rows = must(await client().from('group_members').select('group_id').eq('user_id', uid));
  return new Set(rows.map((r) => r.group_id as string));
}

export function createSupabaseApi(): Api {
  return {
    async getUserId() {
      const { data } = await client().auth.getSession();
      return data.session?.user.id ?? null;
    },
    onAuthChange(callback) {
      const { data } = client().auth.onAuthStateChange((_event, session) => {
        callback(session?.user.id ?? null);
      });
      return () => data.subscription.unsubscribe();
    },
    async signIn(email, password) {
      const { error } = await client().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(error.message);
    },
    async signUp(email, password) {
      const { data, error } = await client().auth.signUp({ email: email.trim(), password });
      if (error) throw new Error(error.message);
      return { needsConfirmation: !data.session };
    },
    async signOut() {
      await client().auth.signOut();
    },

    async getProfile(userId) {
      const row = ok(
        await client().from('profiles').select('*').eq('id', userId).maybeSingle<ProfileRow>(),
      );
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        city: row.city,
        bio: row.bio,
        interests: row.interests,
        avatarEmoji: row.avatar_emoji,
      } satisfies Profile;
    },
    async saveProfile(p) {
      ok(
        await client().from('profiles').upsert({
          id: p.id,
          name: p.name,
          city: p.city,
          bio: p.bio,
          interests: p.interests,
          avatar_emoji: p.avatarEmoji,
        }),
      );
    },

    async listEvents(city) {
      const rows = must(
        await client()
          .from('events')
          .select(EVENT_SELECT)
          .eq('city', city)
          .gt('starts_at', new Date().toISOString())
          .order('starts_at')
          .limit(100)
          .returns<EventRow[]>(),
      );
      const attending = await myAttendance(rows.map((r) => r.id));
      return rows.map((r) => toEvent(r, attending));
    },
    async getEvent(id) {
      const row = must(
        await client().from('events').select(EVENT_SELECT).eq('id', id).single<EventRow>(),
      );
      const attendees = must(
        await client()
          .from('event_attendees')
          .select('profile:profiles(id, name, avatar_emoji)')
          .eq('event_id', id)
          .order('joined_at')
          .returns<{ profile: ProfileRow }[]>(),
      );
      return {
        event: toEvent(row, await myAttendance([id])),
        attendees: attendees.map((a) => toPerson(a.profile)),
      };
    },
    async setAttending(eventId, attending) {
      const uid = await requireUserId();
      if (attending) {
        ok(await client().from('event_attendees').insert({ event_id: eventId, user_id: uid }));
      } else {
        ok(await client().from('event_attendees').delete().match({ event_id: eventId, user_id: uid }));
      }
    },
    async createEvent(input) {
      const uid = await requireUserId();
      const profile = await this.getProfile(uid);
      const row = must(
        await client()
          .from('events')
          .insert({
            title: input.title,
            description: input.description,
            location: input.location,
            starts_at: input.startsAt,
            capacity: input.capacity,
            interest_id: input.interestId,
            group_id: input.groupId,
            city: profile?.city ?? '',
            host_id: uid,
          })
          .select('id')
          .single<{ id: string }>(),
      );
      return row.id;
    },

    async listGroups(city) {
      const rows = must(
        await client().from('groups').select(GROUP_SELECT).eq('city', city).order('name').returns<GroupRow[]>(),
      );
      const memberOf = await myGroups();
      return rows.map((r) => toGroup(r, memberOf));
    },
    async getGroup(id) {
      const row = must(await client().from('groups').select(GROUP_SELECT).eq('id', id).single<GroupRow>());
      const members = must(
        await client()
          .from('group_members')
          .select('profile:profiles(id, name, avatar_emoji)')
          .eq('group_id', id)
          .order('joined_at')
          .returns<{ profile: ProfileRow }[]>(),
      );
      const events = must(
        await client()
          .from('events')
          .select(EVENT_SELECT)
          .eq('group_id', id)
          .gt('starts_at', new Date().toISOString())
          .order('starts_at')
          .returns<EventRow[]>(),
      );
      const attending = await myAttendance(events.map((e) => e.id));
      return {
        group: toGroup(row, await myGroups()),
        members: members.map((m) => toPerson(m.profile)),
        events: events.map((e) => toEvent(e, attending)),
      };
    },
    async setMembership(groupId, member) {
      const uid = await requireUserId();
      if (member) {
        ok(await client().from('group_members').insert({ group_id: groupId, user_id: uid }));
      } else {
        ok(await client().from('group_members').delete().match({ group_id: groupId, user_id: uid }));
      }
    },
    async createGroup(input) {
      const uid = await requireUserId();
      const profile = await this.getProfile(uid);
      const row = must(
        await client()
          .from('groups')
          .insert({
            name: input.name,
            description: input.description,
            interest_id: input.interestId,
            emoji: input.emoji,
            city: profile?.city ?? '',
            created_by: uid,
          })
          .select('id')
          .single<{ id: string }>(),
      );
      return row.id;
    },
    async listMessages(groupId) {
      const rows = must(
        await client()
          .from('group_messages')
          .select('id, author_id, body, created_at, author:profiles(name, avatar_emoji)')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false })
          .limit(100)
          .returns<
            {
              id: string;
              author_id: string;
              body: string;
              created_at: string;
              author: { name: string; avatar_emoji: string } | null;
            }[]
          >(),
      );
      return rows.reverse().map((m) => ({
        id: m.id,
        authorId: m.author_id,
        authorName: m.author?.name ?? 'Unbekannt',
        authorEmoji: m.author?.avatar_emoji ?? '🙂',
        body: m.body,
        createdAt: m.created_at,
      }));
    },
    async postMessage(groupId, body) {
      const uid = await requireUserId();
      ok(await client().from('group_messages').insert({ group_id: groupId, author_id: uid, body }));
    },

    async getDinnerSignup(dinnerDate) {
      const uid = await requireUserId();
      const signup = ok(
        await client()
          .from('dinner_signups')
          .select('budget, diet, table_id')
          .eq('user_id', uid)
          .eq('dinner_date', dinnerDate)
          .maybeSingle<{ budget: 1 | 2 | 3; diet: string; table_id: string | null }>(),
      );
      if (!signup) return null;
      if (!signup.table_id) return { dinnerDate, budget: signup.budget, diet: signup.diet, table: null };

      const table = must(
        await client()
          .from('dinner_tables')
          .select('restaurant, address, time')
          .eq('id', signup.table_id)
          .single<{ restaurant: string; address: string; time: string }>(),
      );
      const guests = must(
        await client()
          .from('dinner_signups')
          .select('profile:profiles(id, name, avatar_emoji)')
          .eq('table_id', signup.table_id)
          .neq('user_id', uid)
          .returns<{ profile: ProfileRow }[]>(),
      );
      return {
        dinnerDate,
        budget: signup.budget,
        diet: signup.diet,
        table: { ...table, guests: guests.map((g) => toPerson(g.profile)) },
      };
    },
    async signUpForDinner(input) {
      const uid = await requireUserId();
      const profile = await this.getProfile(uid);
      ok(
        await client().from('dinner_signups').upsert({
          user_id: uid,
          dinner_date: input.dinnerDate,
          city: profile?.city ?? '',
          budget: input.budget,
          diet: input.diet,
        }),
      );
    },
    async cancelDinner(dinnerDate) {
      const uid = await requireUserId();
      ok(await client().from('dinner_signups').delete().match({ user_id: uid, dinner_date: dinnerDate }));
    },

    async report(targetType, targetId, reason) {
      ok(await client().from('reports').insert({ target_type: targetType, target_id: targetId, reason }));
    },
  };
}
