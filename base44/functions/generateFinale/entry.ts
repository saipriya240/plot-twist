import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { GROUNDING, memoryBlock, loadMemories, authorName } from '../../shared/story.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const monthName = typeof body.month_name === 'string' ? body.month_name.slice(0, 20) : '';
    const year = Number.isFinite(body.year) ? Math.trunc(body.year) : new Date().getFullYear();
    const memories = await loadMemories(base44, body.memory_ids, 60);
    if (!memories.length) {
      return Response.json({ error: 'No memories saved in that month yet.' }, { status: 400 });
    }

    const name = authorName(user);

    const prompt = [
      "You are the showrunner writing a monthly season finale for a private show about one real person's life.",
      GROUNDING,
      `The author is ${name}. The month is ${monthName} ${year}.`,
      'THIS MONTH\'S MEMORIES (the only source you may use):',
      memoryBlock(memories),
      `Return:
- title: 2-6 ALL CAPS words naming the month as a finale episode.
- narrative: 60-110 words, cinematic, only real events from these memories.
- highlights: 3 short phrases (max 8 words each), each tied to something that actually happened.
- memorable_moment: one sentence naming the single most vivid thing recorded.
- people: only names that literally appear in the memories.
- themes: 3 short recurring ideas (1-3 words) actually visible in the memories.
- closing_narration: one closing line under 20 words. Only use real memories.`,
    ].join('\n\n');

    const out = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          narrative: { type: 'string' },
          highlights: { type: 'array', items: { type: 'string' } },
          memorable_moment: { type: 'string' },
          people: { type: 'array', items: { type: 'string' } },
          themes: { type: 'array', items: { type: 'string' } },
          closing_narration: { type: 'string' },
        },
        required: ['title', 'narrative', 'highlights', 'memorable_moment', 'people', 'themes', 'closing_narration'],
      },
    });

    return Response.json(out || {});
  } catch (error) {
    return Response.json({ error: (error && error.message) || 'Could not write the finale.' }, { status: 500 });
  }
}