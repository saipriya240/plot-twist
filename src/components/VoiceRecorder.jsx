import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Loader2, Trash2 } from 'lucide-react';
import { uploadPrivate, useFileUrl } from '@/lib/media';
import { toast } from '@/components/ui/use-toast';

export default function VoiceRecorder({ value, onChange }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileRef = useRef(null);
  const url = useFileUrl(value);

  useEffect(() => {
    if (!recording) return undefined;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        setUploading(true);
        try {
          const uri = await uploadPrivate(file);
          onChange(uri);
        } catch (error) {
          toast({ title: 'Could not save the recording', description: error.message, variant: 'destructive' });
        } finally {
          setUploading(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setRecording(true);
    } catch (error) {
      toast({
        title: 'Microphone unavailable',
        description: 'Allow microphone access, or upload an audio file instead.',
        variant: 'destructive',
      });
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const uri = await uploadPrivate(file);
      onChange(uri);
    } catch (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-md border border-ink-line bg-ink-card p-4">
      {value ? (
        <div className="space-y-3">
          <audio src={url || undefined} controls className="w-full" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="t-kicker flex items-center gap-1.5 text-white/40 hover:text-flare"
          >
            <Trash2 className="h-3 w-3" /> Remove recording
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2">
          <button
            type="button"
            onClick={recording ? stop : start}
            disabled={uploading}
            className={`flex h-16 w-16 items-center justify-center rounded-full border transition ${
              recording ? 'border-flare bg-flare/15 text-flare' : 'border-white/20 text-white'
            }`}
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : recording ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-6 w-6" />}
          </button>
          <p className="t-cinema text-[12px] tracking-[0.24em] text-white/45">
            {uploading ? 'Saving note' : recording ? `Recording ${seconds}s` : 'Tap to record a voice note'}
          </p>
          <button type="button" onClick={() => fileRef.current?.click()} className="t-kicker text-white/35 hover:text-white">
            or upload an audio file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
              e.target.value = '';
            }}
          />
        </div>
      )}
    </div>
  );
}