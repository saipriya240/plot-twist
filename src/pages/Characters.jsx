import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, Users, Pencil } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fmtDate } from '@/lib/format';
import MediaThumb from '@/components/MediaThumb';
import EmptyState from '@/components/EmptyState';
import CharacterDialog from '@/components/CharacterDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const items = (res) => (Array.isArray(res) ? res : (res && res.items) || []);

export default function Characters() {
  const [characters, setCharacters] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    const [charRes, epRes] = await Promise.all([
      base44.entities.Character.filter({}, { sort: '-created_date', limit: 100 }),
      base44.entities.Episode.filter({}, { limit: 200 }),
    ]);
    setCharacters(items(charRes));
    setEpisodes(items(epRes));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const appearances = (characterId) => episodes.filter((episode) => (episode.character_ids || []).includes(characterId));

  const initials = (name) => String(name || '?').slice(0, 2).toUpperCase();

  return (
    <div className="animate-fade-in px-5 pb-6 pt-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="t-kicker text-flare">Cast</p>
          <h1 className="t-hero mt-2.5 text-white">Characters</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="tap t-meta mt-2 flex items-center gap-1.5 rounded-sm bg-flare px-3.5 py-2.5 font-semibold tracking-[0.16em] text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>
      ) : characters.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {characters.map((character) => {
            const count = appearances(character.id).length;
            return (
              <button
                key={character.id}
                type="button"
                onClick={() => setDetail(character)}
                className="overflow-hidden rounded-md border border-ink-line bg-ink-raised text-left transition hover:border-flare/40"
              >
                <div className="relative aspect-[4/5] bg-ink-card">
                  {character.avatar ? (
                    <MediaThumb fileRef={character.avatar} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-4xl italic text-white/25">
                      {initials(character.name)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-base/90 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p className="t-cinema text-[10px] tracking-[0.24em] text-flare">{character.category}</p>
                    <p className="mt-1 truncate font-display text-[19px] leading-tight text-white">{character.name}</p>
                  </div>
                </div>
                <p className="px-2.5 py-2 text-[9px] uppercase tracking-[0.18em] text-white/35">
                  {count} {count === 1 ? 'episode' : 'episodes'}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={Users}
            title="No cast yet"
            body="Add the people who keep showing up in your memories. Or publish an episode and confirm the names the director noticed."
            actionLabel="Add a character"
            onAction={() => {
              setEditing(null);
              setOpen(true);
            }}
          />
        </div>
      )}

      <CharacterDialog open={open} onOpenChange={setOpen} character={editing} characters={characters} onSaved={load} />

      <Dialog open={Boolean(detail)} onOpenChange={(value) => !value && setDetail(null)}>
        <DialogContent className="max-h-[88vh] max-w-md overflow-y-auto border-ink-line bg-ink-raised">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle className="t-episode text-white">{detail.name}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-20 w-20 overflow-hidden rounded-full border border-ink-line bg-ink-card">
                  {detail.avatar ? (
                    <MediaThumb fileRef={detail.avatar} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-2xl italic text-white/30">
                      {initials(detail.name)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="t-cinema text-[11px] tracking-[0.26em] text-flare">{detail.category}</p>
                  <p className="mt-1.5 text-[9.5px] uppercase tracking-[0.18em] text-white/35">
                    First appearance {fmtDate(detail.first_appearance)}
                  </p>
                  <p className="mt-1 text-[9.5px] uppercase tracking-[0.18em] text-white/35">
                    {appearances(detail.id).length} episodes
                  </p>
                </div>
              </div>

              {detail.description ? (
                <p className="text-[13px] leading-relaxed text-white/75">{detail.description}</p>
              ) : (
                <p className="text-[12.5px] text-ink-soft">No description yet. Add one to remember who they are in your story.</p>
              )}

              <div>
                <p className="t-kicker mb-2 text-white/35">Appears in</p>
                {appearances(detail.id).length ? (
                  <div className="space-y-1.5">
                    {appearances(detail.id).map((episode) => (
                      <Link
                        key={episode.id}
                        to={`/episode/${episode.id}`}
                        className="flex items-center gap-2.5 rounded-md border border-ink-line bg-ink-card p-2"
                      >
                        <div className="h-12 w-9 shrink-0 overflow-hidden rounded-sm bg-ink-raised">
                          <MediaThumb fileRef={episode.cover_image} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-display text-[15px] leading-tight text-white">{episode.title}</p>
                          <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-white/30">{fmtDate(episode.release_date || episode.created_date)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-ink-soft">Not linked to an episode yet.</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditing(detail);
                  setDetail(null);
                  setOpen(true);
                }}
                className="t-meta flex w-full items-center justify-center gap-1.5 rounded-sm border border-ink-line py-3 font-semibold tracking-[0.16em] text-white/80"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit character
              </button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}