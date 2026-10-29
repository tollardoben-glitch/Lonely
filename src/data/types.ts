export type Profile = {
  id: string;
  name: string;
  city: string;
  bio: string;
  interests: string[];
  avatarEmoji: string;
};

export type Person = {
  id: string;
  name: string;
  avatarEmoji: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  city: string;
  interestId: string;
  emoji: string;
  memberCount: number;
  isMember: boolean;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  city: string;
  location: string;
  startsAt: string;
  capacity: number;
  interestId: string;
  attendeeCount: number;
  isAttending: boolean;
  hostId: string | null;
  hostName: string;
  groupId: string | null;
  groupName: string | null;
};

export type Message = {
  id: string;
  authorId: string;
  authorName: string;
  authorEmoji: string;
  body: string;
  createdAt: string;
};

export type DinnerTable = {
  restaurant: string;
  address: string;
  time: string;
  guests: Person[];
};

export type DinnerSignup = {
  dinnerDate: string;
  budget: 1 | 2 | 3;
  diet: string;
  table: DinnerTable | null;
};

export type NewEvent = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  capacity: number;
  interestId: string;
  groupId: string | null;
};

export type NewGroup = {
  name: string;
  description: string;
  interestId: string;
  emoji: string;
};

export type ReportTarget = 'user' | 'event' | 'group' | 'message';
