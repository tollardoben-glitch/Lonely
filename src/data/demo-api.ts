import { interestById } from './interests';
import type { Api } from './api';
import type { DinnerSignup, EventItem, Group, Message, Person, Profile } from './types';

type StoredEvent = Omit<EventItem, 'attendeeCount' | 'isAttending' | 'hostName' | 'groupName'> & {
  attendees: string[];
};
type StoredGroup = Omit<Group, 'memberCount' | 'isMember'> & { members: string[] };
type StoredMessage = Omit<Message, 'authorName' | 'authorEmoji'> & { groupId: string };

const DEMO_PEOPLE: Profile[] = [
  { id: 'p1', name: 'Lena', city: '', bio: 'Neu in der Stadt, liebt Pasta.', interests: ['food', 'books'], avatarEmoji: '🌻' },
  { id: 'p2', name: 'Jonas', city: '', bio: 'Brettspiel-Nerd.', interests: ['boardgames', 'tech'], avatarEmoji: '🦊' },
  { id: 'p3', name: 'Aylin', city: '', bio: 'Am Wochenende in den Bergen.', interests: ['hiking', 'sports'], avatarEmoji: '🐼' },
  { id: 'p4', name: 'Marco', city: '', bio: 'Hobbykoch & Gitarrist.', interests: ['food', 'music'], avatarEmoji: '🎸' },
  { id: 'p5', name: 'Sophie', city: '', bio: 'Töpfert seit einem Jahr.', interests: ['crafts', 'art'], avatarEmoji: '🍀' },
  { id: 'p6', name: 'Emre', city: '', bio: 'Lernt gerade Spanisch.', interests: ['languages', 'movies'], avatarEmoji: '🐻' },
];

function daysFromNow(days: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const delay = () => new Promise((resolve) => setTimeout(resolve, 150));

export function createDemoApi(): Api {
  let userId: string | null = null;
  const listeners = new Set<(id: string | null) => void>();
  const profiles = new Map<string, Profile>(DEMO_PEOPLE.map((p) => [p.id, p]));
  const events: StoredEvent[] = [];
  const groups: StoredGroup[] = [];
  const messages: StoredMessage[] = [];
  const dinners = new Map<string, DinnerSignup>();
  const seededCities = new Set<string>();
  let nextId = 1;
  const newId = (prefix: string) => `${prefix}${nextId++}`;

  const emit = () => listeners.forEach((l) => l(userId));
  const me = () => {
    if (!userId) throw new Error('Nicht angemeldet');
    return userId;
  };
  const person = (id: string): Person => {
    const p = profiles.get(id);
    return { id, name: p?.name ?? 'Unbekannt', avatarEmoji: p?.avatarEmoji ?? '🙂' };
  };

  function seedCity(city: string) {
    if (seededCities.has(city)) return;
    seededCities.add(city);
    const g = (name: string, description: string, interestId: string, members: string[]) => {
      const group: StoredGroup = {
        id: newId('g'),
        name,
        description,
        city,
        interestId,
        emoji: interestById(interestId).emoji,
        members,
      };
      groups.push(group);
      return group;
    };
    const games = g('Spieleabend-Crew', 'Jeden Freitag neue und alte Brettspiele. Anfänger willkommen!', 'boardgames', ['p2', 'p6']);
    const hiking = g('Sonntagswanderer', 'Entspannte Touren rund um die Stadt, 10–15 km.', 'hiking', ['p3', 'p1', 'p4']);
    const pottery = g('Töpferkreis', 'Gemeinsam an der Drehscheibe – wir teilen uns ein Atelier.', 'crafts', ['p5']);
    g('Bücherwurm-Club', 'Ein Buch pro Monat, Diskussion bei Kaffee und Kuchen.', 'books', ['p1', 'p6']);

    const e = (
      title: string,
      description: string,
      interestId: string,
      location: string,
      startsAt: string,
      capacity: number,
      hostId: string,
      groupId: string | null,
      attendees: string[],
    ) =>
      events.push({ id: newId('e'), title, description, city, location, startsAt, capacity, interestId, hostId, groupId, attendees });

    e('Spieleabend: Catan & Co.', 'Wir bringen 10+ Spiele mit. Snacks gerne mitbringen.', 'boardgames', 'Café Würfelglück', daysFromNow(2, 19), 12, 'p2', games.id, ['p2', 'p6']);
    e('Wanderung zum Aussichtsturm', 'Ca. 12 km, gemütliches Tempo, Einkehr am Ende.', 'hiking', 'Treffpunkt Hauptbahnhof', daysFromNow(4, 10), 15, 'p3', hiking.id, ['p3', 'p1']);
    e('Töpfern für Anfänger', 'Material ist vorhanden, 15 € Unkostenbeitrag.', 'crafts', 'Atelier Tonwerk', daysFromNow(6, 18, 30), 6, 'p5', pottery.id, ['p5', 'p4', 'p1', 'p2', 'p3']);
    e('Gemeinsam kochen: Pasta from scratch', 'Wir machen Pasta selbst und essen zusammen.', 'food', 'Kochstudio Mitte', daysFromNow(3, 18), 8, 'p4', null, ['p4']);
    e('Sprach-Tandem im Park', 'Spanisch, Englisch, Deutsch – such dir einen Partner.', 'languages', 'Stadtpark, großer Brunnen', daysFromNow(5, 15), 20, 'p6', null, ['p6', 'p2']);

    messages.push(
      { id: newId('m'), groupId: hiking.id, authorId: 'p3', body: 'Wer ist Sonntag dabei? Wetter soll super werden ☀️', createdAt: daysFromNow(-1, 9) },
      { id: newId('m'), groupId: hiking.id, authorId: 'p1', body: 'Ich! Bringe Kuchen mit 🍰', createdAt: daysFromNow(-1, 10) },
      { id: newId('m'), groupId: games.id, authorId: 'p2', body: 'Neu im Regal: Wingspan. Freitag testen?', createdAt: daysFromNow(-2, 20) },
    );
  }

  const toEvent = (e: StoredEvent): EventItem => ({
    ...e,
    attendeeCount: e.attendees.length,
    isAttending: !!userId && e.attendees.includes(userId),
    hostName: e.hostId ? person(e.hostId).name : 'Zusammen-Team',
    groupName: groups.find((g) => g.id === e.groupId)?.name ?? null,
  });
  const toGroup = (g: StoredGroup): Group => ({
    ...g,
    memberCount: g.members.length,
    isMember: !!userId && g.members.includes(userId),
  });
  const findEvent = (id: string) => {
    const e = events.find((x) => x.id === id);
    if (!e) throw new Error('Event nicht gefunden');
    return e;
  };
  const findGroup = (id: string) => {
    const g = groups.find((x) => x.id === id);
    if (!g) throw new Error('Gruppe nicht gefunden');
    return g;
  };

  return {
    async getUserId() {
      return userId;
    },
    onAuthChange(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    async signIn(email) {
      await delay();
      userId = `user:${email.trim().toLowerCase()}`;
      emit();
    },
    async signUp(email) {
      await delay();
      userId = `user:${email.trim().toLowerCase()}`;
      emit();
      return { needsConfirmation: false };
    },
    async signOut() {
      userId = null;
      emit();
    },

    async getProfile(id) {
      return profiles.get(id) ?? null;
    },
    async saveProfile(profile) {
      await delay();
      profiles.set(profile.id, profile);
    },

    async listEvents(city) {
      await delay();
      seedCity(city);
      const now = Date.now();
      return events
        .filter((e) => e.city === city && new Date(e.startsAt).getTime() > now)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .map(toEvent);
    },
    async getEvent(id) {
      await delay();
      const e = findEvent(id);
      return { event: toEvent(e), attendees: e.attendees.map(person) };
    },
    async setAttending(eventId, attending) {
      await delay();
      const e = findEvent(eventId);
      const uid = me();
      if (attending) {
        if (e.attendees.length >= e.capacity) throw new Error('Dieses Treffen ist leider schon voll.');
        if (!e.attendees.includes(uid)) e.attendees.push(uid);
      } else {
        e.attendees = e.attendees.filter((a) => a !== uid);
      }
    },
    async createEvent(input) {
      await delay();
      const uid = me();
      const id = newId('e');
      events.push({ ...input, id, city: profiles.get(uid)?.city ?? '', hostId: uid, attendees: [uid] });
      return id;
    },

    async listGroups(city) {
      await delay();
      seedCity(city);
      return groups.filter((g) => g.city === city).map(toGroup);
    },
    async getGroup(id) {
      await delay();
      const g = findGroup(id);
      const now = Date.now();
      return {
        group: toGroup(g),
        members: g.members.map(person),
        events: events
          .filter((e) => e.groupId === id && new Date(e.startsAt).getTime() > now)
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
          .map(toEvent),
      };
    },
    async setMembership(groupId, member) {
      await delay();
      const g = findGroup(groupId);
      const uid = me();
      if (member && !g.members.includes(uid)) g.members.push(uid);
      if (!member) g.members = g.members.filter((m) => m !== uid);
    },
    async createGroup(input) {
      await delay();
      const uid = me();
      const id = newId('g');
      groups.push({ ...input, id, city: profiles.get(uid)?.city ?? '', members: [uid] });
      return id;
    },
    async listMessages(groupId) {
      await delay();
      return messages
        .filter((m) => m.groupId === groupId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((m) => {
          const author = person(m.authorId);
          return { ...m, authorName: author.name, authorEmoji: author.avatarEmoji };
        });
    },
    async postMessage(groupId, body) {
      await delay();
      if (!findGroup(groupId).members.includes(me())) throw new Error('Tritt der Gruppe bei, um zu schreiben.');
      messages.push({ id: newId('m'), groupId, authorId: me(), body, createdAt: new Date().toISOString() });
    },

    async getDinnerSignup(dinnerDate) {
      await delay();
      return dinners.get(`${me()}|${dinnerDate}`) ?? null;
    },
    async signUpForDinner(input) {
      await delay();
      // The demo seats you right away; the real backend matches tables on Wednesday.
      dinners.set(`${me()}|${input.dinnerDate}`, {
        ...input,
        table: {
          restaurant: 'Trattoria Da Luca',
          address: 'Lindenstraße 12',
          time: '19:30',
          guests: ['p1', 'p3', 'p4', 'p6'].map(person),
        },
      });
    },
    async cancelDinner(dinnerDate) {
      await delay();
      dinners.delete(`${me()}|${dinnerDate}`);
    },

    async report() {
      await delay();
    },
  };
}
