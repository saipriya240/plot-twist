import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { GROUNDING, memoryBlock, loadMemories, authorName } from '../../shared/story.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const memories = await loadMemories(base44, body.memory_ids, 10);
    if (memories.length < 1) {
      return Response.json({ error: 'Add a memory first — a recap needs something to recap.' }, { status: 400 });
    }

    const name = authorName(user);

    const prompt = [
      "You are the narrator of PLOT TWIST, recapping a private show about one real person's life.",
      GROUNDING,
      `The author is ${name}.`,
      'THEIR RECENT MEMORIES:',
      memoryBlock(memories),
      `Write a "previously on" recap of 70-110 words that opens with exactly: Previously, on ${name}'s series...
Then two or three sentences weaving together only what actually happened, in a cinematic voice. No new facts. Return only "recap".`,
    ].join('\n\n');

    const out = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: { recap: { type: 'string' } },
        required: ['recap'],
      },
    });

    return Response.json({ recap: (out && out.recap) || '' });
  } catch (error) {
    return Response.json({ error: (error && error.message) || 'Could not build the recap.' }, { status: 500 });
  }
}