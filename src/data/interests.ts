export type Interest = { id: string; label: string; emoji: string };

export const INTERESTS: Interest[] = [
  { id: 'food', label: 'Essen & Kochen', emoji: '🍝' },
  { id: 'hiking', label: 'Wandern', emoji: '🥾' },
  { id: 'boardgames', label: 'Brettspiele', emoji: '🎲' },
  { id: 'books', label: 'Bücher', emoji: '📚' },
  { id: 'crafts', label: 'Töpfern & Basteln', emoji: '🏺' },
  { id: 'music', label: 'Musik', emoji: '🎸' },
  { id: 'sports', label: 'Sport', emoji: '🏃' },
  { id: 'art', label: 'Kunst & Malen', emoji: '🎨' },
  { id: 'gardening', label: 'Garten', emoji: '🌱' },
  { id: 'languages', label: 'Sprachen', emoji: '🗣️' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'movies', label: 'Film', emoji: '🎬' },
];

export const CITIES = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Leipzig', 'Wien', 'Zürich'];

export const AVATARS = ['🙂', '😄', '🦊', '🐻', '🐼', '🦁', '🐸', '🐙', '🌻', '🌈', '⭐', '🍀'];

export function interestById(id: string): Interest {
  return INTERESTS.find((i) => i.id === id) ?? { id, label: id, emoji: '✨' };
}
