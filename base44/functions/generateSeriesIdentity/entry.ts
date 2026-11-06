import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { GROUNDING, memoryBlock, loadMemories, authorName, clean } from '../../shared/story.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const memories = await loadMemories(base44, body.memory_ids, 10);
    const name = authorName(user);
    const genre = clean(body.genre, 60) || 'not stated';
    const style = clean(body.style, 60) || 'cinematic';
    const focus = Array.isArray(body.focus) ? body.focus.filter((f) => typeof f === 'string').slice(0, 6) : [];

    const prompt = [
      "You are the showrunner naming a new personal documentary series for one real person.",
      GROUNDING,
      `The author's name is ${name}. Life genre: ${genre}. Storytelling style: ${style}. They want to preserve: ${focus.join(', ') || 'not stated'}.`,
      memories.length ? `Recent memories, for tone only:\n${memoryBlock(memories)}` : '',
      `Return:
- series_title: 2-4 ALL CAPS words that name their life as a show (e.g. "THE UNWRITTEN CHAPTERS"). Never their real name.
- season_title: a short season name, 2-4 words, title case (e.g. "The Beginning").
- tagline: one short line about how this season begins, under 14 words.`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const out = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          series_title: { type: 'string' },
          season_title: { type: 'string' },
          tagline: { type: 'string' },
        },
        required: ['series_title', 'season_title', 'tagline'],
      },
    });

    return Response.json(out || {});
  } catch (error) {
    return Response.json({ error: (error && error.message) || 'Could not name your series.' }, { status: 500 });
  }
}