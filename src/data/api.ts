import { isDemoMode } from '@/lib/supabase';

import { createDemoApi } from './demo-api';
import { createSupabaseApi } from './supabase-api';
import type {
  DinnerSignup,
  EventItem,
  Group,
  Message,
  NewEvent,
  NewGroup,
  Person,
  Profile,
  ReportTarget,
} from './types';

export interface Api {
  getUserId(): Promise<string | null>;
  onAuthChange(callback: (userId: string | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  signOut(): Promise<void>;

  getProfile(userId: string): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<void>;

  listEvents(city: string): Promise<EventItem[]>;
  getEvent(id: string): Promise<{ event: EventItem; attendees: Person[] }>;
  setAttending(eventId: string, attending: boolean): Promise<void>;
  createEvent(input: NewEvent): Promise<string>;

  listGroups(city: string): Promise<Group[]>;
  getGroup(id: string): Promise<{ group: Group; members: Person[]; events: EventItem[] }>;
  setMembership(groupId: string, member: boolean): Promise<void>;
  createGroup(input: NewGroup): Promise<string>;
  listMessages(groupId: string): Promise<Message[]>;
  postMessage(groupId: string, body: string): Promise<void>;

  getDinnerSignup(dinnerDate: string): Promise<DinnerSignup | null>;
  signUpForDinner(input: Omit<DinnerSignup, 'table'>): Promise<void>;
  cancelDinner(dinnerDate: string): Promise<void>;

  report(targetType: ReportTarget, targetId: string, reason: string): Promise<void>;
}

export const api: Api = isDemoMode ? createDemoApi() : createSupabaseApi();
