import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { GENRES, GROUNDING, memoryBlock, loadMemories, authorName, clean } from '../../shared/story.ts';

const SCHEMAS = {
  full: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      synopsis: { type: 'string' },
      full_story: { type: 'string' },
      genre: { type: 'string' },
      people_mentioned: { type: 'array', items: { type: 'string' } },
    },
    required: ['title', 'synopsis', 'full_story', 'genre', 'people_mentioned'],
  },
  title: {
    type: 'object',
    properties: { title: { type: 'string' } },
    required: ['title'],
  },
  synopsis: {
    type: 'object',
    properties: { synopsis: { type: 'string' } },
    required: ['synopsis'],
  },
  story: {
    type: 'object',
    properties: { full_story: { type: 'string' } },
    required: ['full_story'],
  },
};

const ASK = {
  full: `Return title, synopsis, full_story (130-190 words in 3 short paragraphs separated by blank lines), genre (exactly one of: ${GENRES.join(', ')}) and people_mentioned.`,
  title: 'Return only a new "title": 2-5 words, ALL CAPS, evoking what actually happened. No other field.',
  synopsis: 'Return only a new "synopsis": one teasing sentence under 32 words. No other field.',
  story: 'Return only a new "full_story": 130-190 words in 3 short paragraphs separated by blank lines, close third person, only real details from the memories. No other field.',
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.memory_ids) ? body.memory_ids : [];
    const part = Object.keys(SCHEMAS).includes(body.part) ? body.part : 'full';
    if (!ids.length) return Response.json({ error: 'Choose at least one memory first.' }, { status: 400 });

    const memories = await loadMemories(base44, ids, 40);
    if (!memories.length) return Response.json({ error: 'Those memories are no longer available.' }, { status: 404 });

    const name = authorName(user);
    const seasonTitle = clean(body.season_title, 80) || 'Season 01';
    const hint = clean(body.hint, 240);
    const today = new Date().toISOString().slice(0, 10);

    const prompt = [
      "You are the head writer of PLOT TWIST, a private cinematic series about one real person's life.",
      GROUNDING,
      `The author is ${name}. Their current season is "${seasonTitle}". Today is ${today}.`,
      hint ? `Direction from the author: ${hint}` : '',
      'THE MEMORIES (the only source you may use):',
      memoryBlock(memories),
      ASK[part],
    ]
      .filter(Boolean)
      .join('\n\n');

    const out = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCHEMAS[part],
    });

    const genre = GENRES.includes(out && out.genre) ? out.genre : GENRES[7];
    return Response.json({ ...out, genre });
  } catch (error) {
    return Response.json(
      { error: (error && error.message) || 'The story director could not write this episode.' },
      { status: 500 }
    );
  }
}