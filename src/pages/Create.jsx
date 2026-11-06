import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import moment from 'moment';
import { PenLine, Camera, Video, Mic, Zap, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { MOODS } from '@/lib/constants';
import { fmtShort, todayISO } from '@/lib/format';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MediaTray from '@/components/MediaTray';
import VoiceRecorder from '@/components/VoiceRecorder';

const TABS = [
  { key: 'write', label: 'Write', icon: PenLine },
  { key: 'photos', label: 'Photos', icon: Camera },
  { key: 'video', label: 'Video', icon: Video },
  { key: 'voice', label: 'Voice', icon: Mic },
  { key: 'quick', label: 'Quick', icon: Zap },
];

const splitList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function Create() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const episodeId = searchParams.get('episode');
  const [tab, setTab] = useState('write');
  const [form, setForm] = useState({
    title: '',
    content: '',
    memory_date: todayISO(),
    memory_time: moment().format('HH:mm'),
    location: '',
    mood: '',
    people: '',
    tags: '',
  });
  const [media, setMedia] = useState([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Season
      .filter({}, { sort: '-season_number', limit: 1 })
      .then((res) => {
        const list = Array.isArray(res) ? res : res.items || [];
        if (list[0]) setSeasonId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    const hasContent = form.content.trim().length > 0;
    if (!hasContent && !media.length && !audioUrl) {
      toast({ title: 'Nothing to save yet', description: 'Write a line, add a photo, or record a voice note.' });
      return;
    }
    setSaving(true);
    try {
      const fallbackTitle = hasContent
        ? form.content.trim().split(/\s+/).slice(0, 7).join(' ')
        : `${media.length ? 'Moments' : 'Voice note'} · ${fmtShort(form.memory_date)}`;

      const payload = {
        title: form.title.trim() || fallbackTitle,
        content: form.content.trim(),
        memory_date: form.memory_date || todayISO(),
        memory_time: form.memory_time,
        location: form.location.trim(),
        people: splitList(form.people),
        tags: splitList(form.tags),
        media,
        audio_url: audioUrl,
        audio_transcript: transcript,
        source: tab,
      };
      if (form.mood) payload.mood = form.mood;
      if (seasonId) payload.season_id = seasonId;

      const memory = await base44.entities.Memory.create(payload);

      if (episodeId) {
        const episode = await base44.entities.Episode.get(episodeId);
        const memoryIds = Array.from(new Set([...(episode.memory_ids || []), memory.id]));
        await base44.entities.Episode.update(episodeId, { memory_ids: memoryIds });
        await base44.entities.Memory.update(memory.id, { episode_id: episodeId });
        toast({ title: 'Memory added to your episode' });
        navigate(`/episode/${episodeId}`);
        return;
      }

      toast({ title: 'Memory added to your story' });
      navigate('/');
    } catch (error) {
      toast({ title: 'Could not save your memory', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in px-5 pb-8 pt-7">
      <p className="t-kicker text-flare">New scene</p>
      <h1 className="t-hero mt-2.5 text-white">Create memory</h1>
      {episodeId ? (
        <p className="t-cinema mt-3 text-[12px] tracking-[0.24em] text-white/40">Adding to an episode</p>
      ) : null}

      <div className="no-scrollbar mt-5 flex gap-1.5 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`t-meta flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 tracking-[0.14em] transition ${
              tab === item.key ? 'border-flare bg-flare/10 text-white' : 'border-ink-line bg-ink-raised text-white/45'
            }`}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'quick' ? (
        <div className="mt-6">
          <p className="t-lead text-white/75">What happened today?</p>
          <Textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={7}
            placeholder="Write a few sentences. Don't edit yourself — future you will love the details."
            className="mt-2 border-ink-line bg-ink-raised text-[14px] leading-relaxed"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-flare py-3.5 t-meta rounded-sm py-4 font-semibold tracking-[0.2em] text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Save to my story
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Memory title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="The coffee that felt like home"
              className="border-ink-line bg-ink-raised text-[15px]"
            />
          </div>

          {tab === 'write' || tab === 'photos' || tab === 'video' ? (
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">What happened</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={6}
                placeholder="Describe the moment — who was there, what was said, how it felt."
                className="border-ink-line bg-ink-raised text-[13.5px] leading-relaxed"
              />
            </div>
          ) : null}

          {tab === 'photos' ? (
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Photos</Label>
              <MediaTray media={media} onChange={setMedia} accept="image/*" kind="image" addLabel="Add photos" />
            </div>
          ) : null}

          {tab === 'video' ? (
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Videos</Label>
              <MediaTray media={media} onChange={setMedia} accept="video/*" kind="video" addLabel="Add videos" />
            </div>
          ) : null}

          {tab === 'voice' ? (
            <div className="space-y-3">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Voice note</Label>
              <VoiceRecorder value={audioUrl} onChange={setAudioUrl} />
              <div className="space-y-2">
                <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Transcription (optional)</Label>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={4}
                  placeholder="Type what you said, so your episode can quote it."
                  className="border-ink-line bg-ink-raised text-[13px] leading-relaxed"
                />
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Date</Label>
              <Input type="date" value={form.memory_date} onChange={(e) => setForm({ ...form, memory_date: e.target.value })} className="border-ink-line bg-ink-raised" />
            </div>
            <div className="space-y-2">
              <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Time</Label>
              <Input type="time" value={form.memory_time} onChange={(e) => setForm({ ...form, memory_time: e.target.value })} className="border-ink-line bg-ink-raised" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Location (optional)</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Where were you?" className="border-ink-line bg-ink-raised" />
          </div>

          <div className="space-y-2">
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Mood</Label>
            <Select value={form.mood} onValueChange={(value) => setForm({ ...form, mood: value })}>
              <SelectTrigger className="border-ink-line bg-ink-raised text-[13px]"><SelectValue placeholder="How did it feel?" /></SelectTrigger>
              <SelectContent>
                {MOODS.map((mood) => (
                  <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">People involved</Label>
            <Input value={form.people} onChange={(e) => setForm({ ...form, people: e.target.value })} placeholder="Ananya, Rahul" className="border-ink-line bg-ink-raised" />
            <p className="text-[10px] text-white/25">Separate names with commas.</p>
          </div>

          <div className="space-y-2">
            <Label className="t-kicker text-[10px] tracking-[0.24em] text-white/45">Tags</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="coffee, school, laughter" className="border-ink-line bg-ink-raised" />
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-flare py-4 t-meta rounded-sm py-4 font-semibold tracking-[0.2em] text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Add to my story
          </button>
          <p className="t-kicker pb-2 text-center text-white/25">
            Private by default · Only you can see this
          </p>
        </div>
      )}
    </div>
  );
}