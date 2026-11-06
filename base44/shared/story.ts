export const GENRES = [
  'Romance',
  'Comedy',
  'Drama',
  'Adventure',
  'Coming of Age',
  'Mystery',
  'Slice of Life',
  'A little bit of everything',
];

export const GROUNDING = `ABSOLUTE RULES:
- Use only facts that literally appear in the memories provided. Never invent events, conversations, people, places, feelings, relationships, jobs, ages or outcomes.
- If a detail is not in the memories, leave it out rather than filling the gap.
- Never state statistics, counts or dates that the memories do not support.
- Never guess a person's relationship to the author unless the memory states it.
- Write with cinematic warmth, but stay strictly factual.
- If the memories are thin, write something short rather than inventing detail.`;

export const memoryBlock = (memories) =>
  memories
    .map((m, i) => {
      const date = m.memory_date || String(m.created_date || '').slice(0, 10);
      const people = (m.people || []).join(', ');
      const tags = (m.tags || []).join(', ');
      const captionText = (m.media || [])
        .map((item) => item && item.caption)
        .filter(Boolean)
        .join(' / ');
      const body = m.content || m.audio_transcript || captionText || '(no written text)';
      return `Memory ${i + 1}
Date: ${date || 'unknown'}
Title: ${m.title || 'Untitled'}
Mood: ${m.mood || 'not stated'}
People: ${people || 'none stated'}
Place: ${m.location || 'not stated'}
Tags: ${tags || 'none'}
Text: ${String(body).slice(0, 1400)}`;
    })
    .join('\n\n');

export const loadMemories = async (base44, ids, limit = 40) => {
  const safeIds = (Array.isArray(ids) ? ids : [])
    .filter((id) => typeof id === 'string')
    .slice(0, limit);
  if (!safeIds.length) return [];
  const found = await base44.entities.Memory.filter({ id: { $in: safeIds } }, { limit });
  const list = Array.isArray(found) ? found : found.items || [];
  return list.sort((a, b) =>
    String(a.memory_date || a.created_date || '').localeCompare(String(b.memory_date || b.created_date || ''))
  );
};

export const clean = (value, max = 6000) => (typeof value === 'string' ? value.slice(0, max) : '');

export const authorName = (user) =>
  (user && user.data && user.data.display_name) || (user && user.full_name) || 'the author';