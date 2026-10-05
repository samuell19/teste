import { useEffect, useRef, useState } from "react";

export function useSound() {
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const context = useRef(null);
  const audio = useRef(null);
  const source = useRef("");
  const enabledRef = useRef(false);

  useEffect(() => {
    const player = new Audio();
    audio.current = player;
    const update = () => { setTime(player.currentTime); setDuration(Number.isFinite(player.duration) ? player.duration : 0); };
    const onError = () => { setError("Essa música não carregou. Você pode tentar de novo."); setPlaying(false); };
    player.addEventListener("timeupdate", update);
    player.addEventListener("loadedmetadata", update);
    player.addEventListener("error", onError);
    player.addEventListener("play", () => setPlaying(true));
    player.addEventListener("pause", () => setPlaying(false));
    return () => { player.pause(); player.removeAttribute("src"); player.load(); context.current?.close(); };
  }, []);

  const toggleSound = () => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    if (audio.current) audio.current.muted = !next;
    if (next) context.current?.resume();
  };

  const chime = () => {
    if (!enabledRef.current) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      if (!context.current || context.current.state === "closed") context.current = new AudioContext();
      const ctx = context.current;
      ctx.resume();
      [293.66, 440, 587.33].forEach((frequency, i) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + i * .055;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(.027, start + .015);
        gain.gain.exponentialRampToValueAtTime(.0001, start + .55);
        oscillator.connect(gain); gain.connect(ctx.destination);
        oscillator.start(start); oscillator.stop(start + .6);
      });
    } catch { /* Exploration remains available without an audio device. */ }
  };

  const toggleTrack = async (url) => {
    if (!url || !audio.current) return;
    const player = audio.current;
    if (source.current === url && !player.paused) { player.pause(); return; }
    if (source.current !== url) { player.src = url; source.current = url; setTime(0); setDuration(0); }
    if (!enabledRef.current) toggleSound();
    setError("");
    try { await player.play(); } catch { setError("O áudio não começou. Toque novamente para tentar."); }
  };

  return { enabled, toggleSound, chime, playing, error, time, duration, toggleTrack, pause: () => audio.current?.pause(), seek: (t) => { if (audio.current && duration) audio.current.currentTime = t; } };
}
