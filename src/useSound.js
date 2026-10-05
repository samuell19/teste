import { useEffect, useRef, useState } from "react";

export function useSound() {
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const context = useRef(null);
  const audio = useRef(null);
  const source = useRef("");
  const enabledRef = useRef(false);
  const request = useRef(0);

  useEffect(() => {
    const player = new Audio();
    player.preload = "metadata";
    audio.current = player;
    const update = () => { setTime(player.currentTime); setDuration(Number.isFinite(player.duration) ? player.duration : 0); };
    const onError = () => { setError("Essa música não carregou. Você pode tentar de novo."); setPlaying(false); setLoading(false); };
    const onPause = () => { setPlaying(false); setLoading(false); };
    const onPlaying = () => { setPlaying(true); setLoading(false); };
    const onWaiting = () => { if (!player.paused) setLoading(true); };
    player.addEventListener("timeupdate", update);
    player.addEventListener("loadedmetadata", update);
    player.addEventListener("error", onError);
    player.addEventListener("playing", onPlaying);
    player.addEventListener("pause", onPause);
    player.addEventListener("ended", onPause);
    player.addEventListener("waiting", onWaiting);
    return () => {
      request.current++;
      player.removeEventListener("timeupdate", update);
      player.removeEventListener("loadedmetadata", update);
      player.removeEventListener("error", onError);
      player.removeEventListener("playing", onPlaying);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onPause);
      player.removeEventListener("waiting", onWaiting);
      player.pause(); player.removeAttribute("src"); player.load(); context.current?.close();
    };
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

  const pause = () => {
    request.current++;
    audio.current?.pause();
    setPlaying(false); setLoading(false);
  };

  const playTrack = async (url) => {
    if (!url || !audio.current) return;
    const player = audio.current;
    const token = ++request.current;
    if (source.current !== url) {
      player.pause();
      player.src = url; source.current = url; setCurrentUrl(url);
      setTime(0); setDuration(0); setPlaying(false);
    }
    if (player.ended) player.currentTime = 0;
    if (!enabledRef.current) toggleSound();
    setError(""); setLoading(true);
    try {
      await player.play();
      if (token === request.current) setLoading(false);
    } catch (error) {
      if (token !== request.current || error.name === "AbortError") return;
      setError("O áudio não começou. Toque novamente para tentar.");
      setLoading(false); setPlaying(false);
    }
  };

  const toggleTrack = (url) => {
    if (source.current === url && audio.current && !audio.current.paused) pause();
    else playTrack(url);
  };

  return { enabled, toggleSound, chime, playing, loading, currentUrl, error, time, duration, playTrack, toggleTrack, pause, seek: (t) => { if (audio.current && duration) audio.current.currentTime = Math.max(0, Math.min(t, duration)); } };
}
