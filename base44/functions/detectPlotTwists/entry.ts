import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { GROUNDING, memoryBlock, loadMemories } from '../../shared/story.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const memories = await loadMemories(base44, body.memory_ids, 60);
    if (memories.length < 2) {
      return Response.json({ error: 'Save a few memories first — patterns need more than one.' }, { status: 400 });
    }

    const idList = memories
      .map((m) => `- ${m.id} :: ${m.memory_date || ''} :: ${m.title || 'Untitled'}`)
      .join('\n');

    const prompt = [
      "You are the story analyst of PLOT TWIST. You read a real person's saved memories and point out observable patterns across time.",
      GROUNDING,
      'ADDITIONAL RULES: No psychological or personality diagnoses. No claims about who the author "really is". Only observable patterns, changes and repetitions visible in the text below.',
      'MEMORIES (oldest first, with dates):',
      memoryBlock(memories),
      `MEMORY IDS (copy these ids exactly when citing evidence):\n${idList}`,
      `Return up to 4 insights. Each must be:
- title: 3-6 words, ALL CAPS.
- insight: 1-2 sentences describing an observable pattern, change or milestone, citing the dates it spans.
- memory_ids: ids of the 1-3 memories that support it, copied exactly from MEMORY IDS.
- kind: one of "change", "new", "recurring", "milestone", "people".
If there is not enough material, return fewer insights (or an empty list) rather than inventing one.`,
    ].join('\n\n');

    const out = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                insight: { type: 'string' },
                memory_ids: { type: 'array', items: { type: 'string' } },
                kind: { type: 'string' },
              },
              required: ['title', 'insight', 'memory_ids', 'kind'],
            },
          },
        },
        required: ['insights'],
      },
    });

    const validIds = new Set(memories.map((m) => m.id));
    const insights = ((out && out.insights) || [])
      .map((item) => ({
        ...item,
        memory_ids: (item.memory_ids || []).filter((id) => validIds.has(id)),
      }))
      .filter((item) => item.memory_ids.length > 0)
      .slice(0, 4);

    return Response.json({ insights });
  } catch (error) {
    return Response.json({ error: (error && error.message) || 'Could not scan your story.' }, { status: 500 });
  }
}