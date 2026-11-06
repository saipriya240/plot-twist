import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { GENRES, MEMORY_KINDS, STORYTELLING_STYLES, COVERS } from '@/lib/constants';
import { todayISO } from '@/lib/format';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, Check } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [genre, setGenre] = useState(GENRES[7]);
  const [focus, setFocus] = useState([]);
  const [style, setStyle] = useState(STORYTELLING_STYLES[0].value);
  const [identity, setIdentity] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleFocus = (item) =>
    setFocus((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));

  const buildIdentity = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke('generateSeriesIdentity', {
        genre,
        style,
        focus,
      });
      const data = res.data || {};
      if (data.error) throw new Error(data.error);
      setIdentity({
        series_title: data.series_title,
        season_title: data.season_title,
        tagline: data.tagline,
      });
    } catch (error) {
      setIdentity({
        series_title: `${(name.trim() || 'MY LIFE').toUpperCase()}, THE SERIES`,
        season_title: 'The Beginning',
        tagline: 'Every ordinary day, an episode.',
      });
    } finally {
      setBusy(false);
      setStep(3);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        display_name: name.trim(),
        date_of_birth: dob || '',
        preferred_genre: genre,
        memory_focus: focus,
        storytelling_style: style,
        series_title: identity.series_title,
        season_tagline: identity.tagline,
        onboarded: true,
        notify_weekly: true,
        notify_finale: true,
        private_series: true,
      });
      const existing = await base44.entities.Season.filter({}, { limit: 1 });
      if (!(existing.items || []).length) {
        await base44.entities.Season.create({
          title: identity.season_title || 'The Beginning',
          description: identity.tagline || '',
          season_number: 1,
          cover_image: COVERS[0],
          start_date: todayISO(),
          status: 'active',
        });
      }
      navigate('/', { replace: true });
    } catch (error) {
      toast({ title: 'Could not save your series', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step === 0 && !name.trim()) {
      toast({ title: 'We need a name', description: 'What should we call you on screen?' });
      return;
    }
    if (step === 2) {
      buildIdentity();
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="min-h-screen bg-ink-base">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-12">
        <div className="mb-10 flex items-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-flare' : 'bg-white/12'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="flex-1">
              <p className="t-cinema text-[12px] tracking-[0.42em] text-flare">Pilot episode</p>
              <h2 className="t-season mt-4 text-white">What should we call you?</h2>
              <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-ink-soft">
                This is the name your narrator will use. It appears on your series, never publicly.
              </p>
              <div className="mt-9 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="t-kicker text-[10px] tracking-[0.24em] text-white/50">Your name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya" className="h-12 rounded-sm border-ink-line bg-ink-raised font-display text-[17px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob" className="t-kicker text-[10px] tracking-[0.24em] text-white/50">Date of birth (optional)</Label>
                  <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="h-12 border-ink-line bg-ink-raised text-base" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="flex-1">
              <p className="t-cinema text-[12px] tracking-[0.42em] text-flare">Genre</p>
              <h2 className="t-season mt-4 text-white">What genre is your life?</h2>
              <div className="mt-6 flex flex-wrap gap-2">
                {GENRES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setGenre(item)}
                    className={`rounded-sm border px-3.5 py-2 text-[12px] tracking-[0.01em] transition ${
                      genre === item ? 'border-flare bg-flare/12 text-white' : 'border-ink-line bg-ink-raised text-white/55'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <p className="t-cinema mt-10 text-[12px] tracking-[0.42em] text-flare">Keep forever</p>
              <h3 className="t-section mt-3 text-white">What memories matter most?</h3>
              <div className="mt-4 grid gap-2">
                {MEMORY_KINDS.map((item) => {
                  const active = focus.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleFocus(item)}
                      className={`flex items-center justify-between rounded-sm border px-4 py-3 text-left font-display text-[16px] transition ${
                        active ? 'border-flare/70 bg-flare/10 text-white' : 'border-ink-line bg-ink-raised text-white/60'
                      }`}
                    >
                      {item}
                      {active ? <Check className="h-3.5 w-3.5 text-flare" /> : null}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="flex-1">
              <p className="t-cinema text-[12px] tracking-[0.42em] text-flare">Narration</p>
              <h2 className="t-season mt-4 text-white">How should it be told?</h2>
              <div className="mt-7 space-y-2.5">
                {STORYTELLING_STYLES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStyle(item.value)}
                    className={`w-full rounded-md border px-4 py-4 text-left transition ${
                      style === item.value ? 'border-flare bg-flare/10' : 'border-ink-line bg-ink-raised'
                    }`}
                  >
                    <p className="font-display text-[17px] leading-tight text-white">{item.label}</p>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-soft">{item.hint}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && identity && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-1 flex-col justify-center">
              <p className="t-cinema text-[12px] tracking-[0.42em] text-flare">Your series</p>
              <h2 className="t-hero mt-4 text-white">{identity.series_title}</h2>
              <p className="t-cinema mt-8 text-[12px] tracking-[0.36em] text-white/40">Season 01</p>
              <p className="t-episode mt-2.5 text-white">{identity.season_title}</p>
              <p className="t-lead mt-6 border-l-2 border-flare pl-4 text-white/70">
                {identity.tagline}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10">
          {step === 3 ? (
            <button
              type="button"
              onClick={finish}
              disabled={saving}
              className="tap t-meta flex w-full items-center justify-center gap-2 rounded-sm bg-flare py-4 font-semibold tracking-[0.2em] text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enter my series
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              disabled={busy}
              className="tap t-meta flex w-full items-center justify-center gap-2 rounded-sm bg-flare py-4 font-semibold tracking-[0.2em] text-white disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? 'Naming your series' : 'Continue'}
              {!busy ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          )}
          {step > 0 && step < 3 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="t-kicker mt-4 w-full text-white/35">
              Back
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}