import { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { Clock, Loader2, PenLine } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fmtDate } from '@/lib/format';
import MediaThumb from '@/components/MediaThumb';
import EmptyState from '@/components/EmptyState';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

const items = (res) => (Array.isArray(res) ? res : (res && res.items) || []);

const TABS = [
  { key: 'day', label: 'On this day' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'A month' },
  { key: 'person', label: 'A person' },
];

export default function TimeMachine() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('day');
  const [month, setMonth] = useState(moment().subtract(1, 'year').format('YYYY-MM'));
  const [person, setPerson] = useState('');
  const [reflection, setReflection] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Memory
      .filter({}, { sort: '-memory_date', limit: 250 })
      .then((res) => setMemories(items(res)))
      .finally(() => setLoading(false));
  }, []);

  const people = useMemo(() => {
    const set = new Set();
    memories.forEach((memory) => (memory.people || []).forEach((name) => set.add(name)));
    return Array.from(set).sort();
  }, [memories]);

  const results = useMemo(() => {
    const withDates = memories.filter((m) => m.memory_date);
    if (tab === 'day') {
      const stamp = moment().format('MM-DD');
      return withDates.filter((m) => moment(m.memory_date).format('MM-DD') === stamp);
    }
    if (tab === 'week') {
      const start = moment().subtract(1, 'year').startOf('week');
      const end = moment().subtract(1, 'year').endOf('week');
      return withDates.filter((m) => {
        const date = moment(m.memory_date);
        return date.isBetween(start, end, 'day', '[]');
      });
    }
    if (tab === 'month') {
      return withDates.filter((m) => String(m.memory_date).startsWith(month));
    }
    if (!person) return [];
    return withDates.filter((m) => (m.people || []).includes(person));
  }, [memories, tab, month, person]);

  const saveReflection = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const entry = `[${moment().format('D MMM YYYY')}] ${note.trim()}`;
      const combined = reflection.reflection ? `${reflection.reflection}\n\n${entry}` : entry;
      await base44.entities.Memory.update(reflection.id, { reflection: combined });
      setMemories((prev) => prev.map((m) => (m.id === reflection.id ? { ...m, reflection: combined } : m)));
      setReflection(null);
      setNote('');
      toast({ title: 'Reflection added' });
    } catch (error) {
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const heading = {
    day: 'On this day, one year ago…',
    week: 'This week, last year',
    month: `Memories from ${moment(`${month}-01`).format('MMMM YYYY')}`,
    person: person ? `The story with ${person}` : 'Choose a person',
  }[tab];

  return (
    <div className="animate-fade-in px-5 pb-8 pt-7">
      <p className="t-kicker text-flare">Rewind</p>
      <h1 className="t-hero mt-2.5 text-white">Time machine</h1>

      <div className="no-scrollbar mt-5 flex gap-1.5 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`t-meta shrink-0 rounded-full border px-3.5 py-2 tracking-[0.14em] transition ${
              tab === item.key ? 'border-flare bg-flare/10 text-white' : 'border-ink-line bg-ink-raised text-white/45'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'month' ? (
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-4 border-ink-line bg-ink-raised" />
      ) : null}

      {tab === 'person' ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {people.length ? (
            people.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setPerson(name)}
                className={`rounded-full border px-3 py-1.5 font-display text-[13px] italic transition ${
                  person === name ? 'border-flare text-white' : 'border-ink-line text-white/50'
                }`}
              >
                {name}
              </button>
            ))
          ) : (
            <p className="text-[12px] text-ink-soft">Add names to your memories and they'll appear here.</p>
          )}
        </div>
      ) : null}

      <p className="t-lead mt-7 text-white/60">{heading}</p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
      ) : results.length ? (
        <div className="relative mt-4 space-y-3 border-l border-ink-line pl-4">
          {results.map((memory) => (
            <div key={memory.id} className="relative rounded-md border border-ink-line bg-ink-raised p-3.5">
              <span className="absolute -left-[22px] top-5 h-1.5 w-1.5 rounded-full bg-flare" />
              <p className="t-cinema text-[11px] tracking-[0.26em] text-flare">{fmtDate(memory.memory_date)}</p>
              <p className="t-card mt-1.5 text-white">{memory.title}</p>
              {memory.content ? <p className="mt-2 line-clamp-4 text-[12.5px] leading-relaxed text-white/65">{memory.content}</p> : null}
              {memory.reflection ? (
                <p className="t-quote mt-2.5 whitespace-pre-line border-l border-white/15 pl-2.5 text-white/45">
                  {memory.reflection}
                </p>
              ) : null}
              {memory.media && memory.media.length ? (
                <div className="mt-2.5 flex gap-1.5">
                  {memory.media.slice(0, 3).map((item, index) => (
                    <div key={`${item.url}-${index}`} className="h-16 w-16 overflow-hidden rounded-sm bg-ink-card">
                      <MediaThumb fileRef={item.url} kind={item.type === 'video' ? 'video' : 'image'} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setReflection(memory);
                  setNote('');
                }}
                className="t-kicker mt-3 flex items-center gap-1.5 text-white/40 hover:text-flare"
              >
                <PenLine className="h-3 w-3" /> Add a reflection
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            icon={Clock}
            title="Nothing from then"
            body={
              tab === 'day'
                ? 'No memories saved on this date in other years. Come back after a few more months of your story.'
                : 'Try another month, person, or range.'
            }
          />
        </div>
      )}

      <Dialog open={Boolean(reflection)} onOpenChange={(value) => !value && setReflection(null)}>
        <DialogContent className="max-w-md border-ink-line bg-ink-raised">
          <DialogHeader>
            <DialogTitle className="t-card text-white">{reflection?.title}</DialogTitle>
            <DialogDescription className="text-[12px] text-ink-soft">
              Looking back, what do you notice now?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Reflection</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="border-ink-line bg-ink-card text-[13px]" />
            <button
              type="button"
              onClick={saveReflection}
              disabled={saving}
              className="t-meta flex w-full items-center justify-center gap-2 rounded-sm bg-flare py-3.5 font-semibold tracking-[0.18em] text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save reflection
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}