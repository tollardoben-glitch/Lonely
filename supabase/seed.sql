-- Optionale Beispieldaten (Gruppen & Treffen in Berlin), damit die App nicht leer startet.
-- Nach schema.sql im SQL Editor ausführen.

with g as (
  insert into public.groups (name, description, city, interest_id, emoji) values
    ('Spieleabend-Crew', 'Jeden Freitag neue und alte Brettspiele. Anfänger willkommen!', 'Berlin', 'boardgames', '🎲'),
    ('Sonntagswanderer', 'Entspannte Touren rund um die Stadt, 10–15 km.', 'Berlin', 'hiking', '🥾'),
    ('Töpferkreis', 'Gemeinsam an der Drehscheibe – wir teilen uns ein Atelier.', 'Berlin', 'crafts', '🏺'),
    ('Bücherwurm-Club', 'Ein Buch pro Monat, Diskussion bei Kaffee und Kuchen.', 'Berlin', 'books', '📚')
  returning id, interest_id
)
insert into public.events (title, description, city, location, starts_at, capacity, interest_id, group_id)
select e.title, e.description, 'Berlin', e.location, now() + e.offset_, e.capacity, e.interest_id,
       (select id from g where g.interest_id = e.interest_id)
from (values
  ('Spieleabend: Catan & Co.', 'Wir bringen 10+ Spiele mit. Snacks gerne mitbringen.', 'Café Würfelglück', interval '2 days', 12, 'boardgames'),
  ('Wanderung zum Teufelsberg', 'Ca. 12 km, gemütliches Tempo, Einkehr am Ende.', 'S Heerstraße', interval '4 days', 15, 'hiking'),
  ('Töpfern für Anfänger', 'Material ist vorhanden, 15 € Unkostenbeitrag.', 'Atelier Tonwerk, Neukölln', interval '6 days', 6, 'crafts'),
  ('Gemeinsam kochen: Pasta from scratch', 'Wir machen Pasta selbst und essen zusammen.', 'Kochstudio Mitte', interval '3 days', 8, 'food')
) as e(title, description, location, offset_, capacity, interest_id);
