import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { GROUNDING, memoryBlock, loadMemories, authorName } from '../../shared/story.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const scopeLabel = typeof body.scope_label === 'string' ? body.scope_label.slice(0, 60) : 'this chapter';
    const memories = await loadMemories(base44, body.memory_ids, 40);
    if (!memories.length) {
      return Response.json({ error: 'Pick at least one memory for the trailer.' }, { status: 400 });
    }

    const name = authorName(user);

    const prompt = [
      "You are cutting a cinematic trailer for a private show about one real person's life.",
      GROUNDING,
      `The author is ${name}. The trailer covers: ${scopeLabel}.`,
      'THE MEMORIES IN THE TRAILER:',
      memoryBlock(memories),
      `Return:
- title: 2-5 ALL CAPS words for the trailer.
- script: 80-130 words of voiceover, short lines, cinematic pacing, separated by blank lines. Short connective lines are fine ("There were unexpected moments.") but every specific detail must come from the memories.
- lines: 5-8 very short on-screen text lines (max 7 words each) for the storyboard, in order.`,
    ].join('\n\n');

    const out = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          script: { type: 'string' },
          lines: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'script', 'lines'],
      },
    });

    return Response.json(out || {});
  } catch (error) {
    return Response.json({ error: (error && error.message) || 'Could not cut the trailer.' }, { status: 500 });
  }
}