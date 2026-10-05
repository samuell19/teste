import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, DoorOpen, Flame, Gift, Image as ImageIcon, Mail, Moon, Music2, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { gift, dedications } from "./content";
import { musicRooms, scenes } from "./scenes";
import { useSound } from "./useSound";
import Vinny from "./Vinny";

const icons = { book: BookOpen, door: DoorOpen, stairs: ArrowRight, fire: Flame, photo: ImageIcon };
const storageKey = "midnight-castle-discoveries-v1";
const sceneFromHash = () => scenes[location.hash.slice(1)] ? location.hash.slice(1) : "exterior";

function readDiscoveries() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(saved) ? [...new Set(saved.filter(id => musicRooms.includes(id)))] : [];
  } catch { return []; }
}

function IconButton({ label, children, className = "", ...props }) {
  return <button type="button" className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}

function Prop({ kind, found }) {
  if (kind === "record") return <span className={`prop record ${found ? "found" : ""}`}><span className="record-label"><Music2 size={14} /></span></span>;
  if (kind === "letter") return <span className="prop envelope"><span className="wax-seal"><Moon size={10} /></span></span>;
  if (kind === "gift") return <span className="prop gift-box"><span className="gift-lid" /><span className="gift-ribbon" /><span className="gift-bow" /></span>;
  if (kind === "book") return <span className="prop old-book"><Moon size={22} /><span className="book-corner" /></span>;
  if (kind === "frame") return <span className="prop little-frame"><Moon size={18} /></span>;
  return null;
}

function Hotspot({ spot, found, onSelect }) {
  const Icon = icons[spot.icon] || Sparkles;
  return <button type="button" className={`hotspot ${spot.prop ? "object-hotspot" : "route-hotspot"} ${spot.invisible ? "invisible-hotspot" : ""} ${found ? "discovered" : ""}`} style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }} aria-label={spot.label} data-hotspot={spot.id} onClick={() => onSelect(spot)}>
    {spot.prop ? <Prop kind={spot.prop} found={found} /> : !spot.invisible && <span className="gate-mark"><Icon size={19} strokeWidth={1.5} /></span>}
    {!spot.invisible && <span className="hotspot-glint"><Sparkles size={13} strokeWidth={1.2} /></span>}
    <span className="hotspot-label">{spot.label}</span>
  </button>;
}

function Scene({ id, discoveries, onSelect, onReady, mood }) {
  const active = useIsPresent();
  const scene = scenes[id];
  const viewport = useRef(null);
  const dragging = useRef(null);
  const didDrag = useRef(false);
  const [dimensions, setDimensions] = useState({ width: 390, height: 844 });
  const [position, setPosition] = useState(.5);
  const [failed, setFailed] = useState(false);
  const [petCommand, setPetCommand] = useState(null);
  const [artLoaded, setArtLoaded] = useState(false);
  const portrait = scene.ratio < 1;
  const canvasHeight = dimensions.height;
  const canvasWidth = canvasHeight * scene.ratio;
  const scrollable = canvasWidth > dimensions.width + 8;

  useLayoutEffect(() => {
    const element = viewport.current;
    const resize = () => setDimensions({ width: element.clientWidth, height: element.clientHeight });
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const element = viewport.current;
    const max = Math.max(0, canvasWidth - dimensions.width);
    element.scrollLeft = Math.max(0, Math.min(max, canvasWidth * scene.focus - dimensions.width / 2));
    setPosition(max ? element.scrollLeft / max : .5);
  }, [canvasWidth, dimensions.width, scene.focus]);

  const pan = (direction) => {
    const element = viewport.current;
    element.scrollBy({ left: direction * dimensions.width * .65, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  const approach = (spot) => {
    if (id === "exterior") { onSelect(spot); return; }
    const offset = spot.type ? 65 : 0;
    setPetCommand({
      x: canvasWidth * spot.x / 100 - offset,
      y: canvasHeight * Math.max(.72, Math.min(.835, spot.y / 100 + .085)),
      onArrive: () => onSelect(spot),
    });
  };

  return <div className={`scene-scape ${portrait ? "portrait-scene" : "wide-scene"}`}>
    {portrait && <div className="scene-extension" style={{ backgroundImage: `url(${scene.image})` }} aria-hidden="true" />}
    <div className="scene-viewport" ref={viewport} onScroll={() => {
      const element = viewport.current;
      const max = element.scrollWidth - element.clientWidth;
      setPosition(max > 0 ? element.scrollLeft / max : .5);
    }} onPointerDown={(event) => {
      if (event.target.closest("button")) { didDrag.current = false; return; }
      dragging.current = { x: event.clientX, left: viewport.current.scrollLeft };
      didDrag.current = false;
    }} onPointerMove={(event) => {
      if (!dragging.current) return;
      const delta = event.clientX - dragging.current.x;
      if (Math.abs(delta) > 5) didDrag.current = true;
      if (event.pointerType === "touch") return;
      viewport.current.scrollLeft = dragging.current.left - delta;
    }} onPointerUp={() => { dragging.current = null; }} onPointerLeave={() => { dragging.current = null; }}>
      <div className="scene-canvas" style={{ width: canvasWidth, height: canvasHeight, marginInline: canvasWidth < dimensions.width ? "auto" : 0 }} onClick={event => {
        if (id === "exterior" || event.target.closest("button") || didDrag.current || mood) return;
        const rectangle = event.currentTarget.getBoundingClientRect();
        const y = event.clientY - rectangle.top;
        if (y < canvasHeight * .55) return;
        setPetCommand({ x: event.clientX - rectangle.left, y });
      }}>
        <img className="scene-art" src={scene.image} srcSet={`${scene.image} 1x, ${scene.image.replace(".webp", "-detail.webp")} 2x`} alt={scene.description} draggable="false" fetchPriority="high" onLoad={() => { setArtLoaded(true); onReady(); }} onError={() => { setFailed(true); onReady(); }} />
        <div className={`atmosphere ${scene.motes}`} aria-hidden="true">{Array.from({ length: 13 }, (_, i) => <i key={i} style={{ "--x": `${8 + ((i * 37) % 85)}%`, "--delay": `${-i * 1.9}s`, "--duration": `${12 + i % 5 * 3}s` }} />)}</div>
        {scene.fire && <div className="firelight" aria-hidden="true" style={{ left: `${scene.fire.x}%`, top: `${scene.fire.y}%` }} />}
        {scene.hotspots.map(spot => <Hotspot key={spot.id} spot={spot} found={spot.type === "song" && discoveries.includes(id)} onSelect={s => { if (!didDrag.current) approach(s); }} />)}
        {id !== "exterior" && <Vinny width={canvasWidth} height={canvasHeight} focus={scene.focus} viewport={viewport} command={petCommand} mood={mood} visible={artLoaded && !failed} active={active} />}
      </div>
    </div>
    {scrollable && <div className="pan-controls" aria-label="Câmera do cenário">
      <IconButton label="Olhar para a esquerda" onClick={() => pan(-1)} disabled={position < .01}><ChevronLeft size={19} /></IconButton>
      <span className="camera-track" aria-hidden="true"><span style={{ left: `${position * 100}%` }} /></span>
      <IconButton label="Olhar para a direita" onClick={() => pan(1)} disabled={position > .99}><ChevronRight size={19} /></IconButton>
    </div>}
    {failed && <div className="art-error"><Moon /><p>O cenário não carregou.</p><button className="text-action" onClick={() => location.reload()}>Tentar de novo</button></div>}
  </div>;
}

function Candle({ lit, label }) {
  return <span className={`candle ${lit ? "lit" : ""}`} role="img" aria-label={label}><span className="candle-flame" /><span className="candle-body" /></span>;
}

function Dialog({ children, label, onClose, className = "" }) {
  const panel = useRef(null);
  const previous = useRef(document.activeElement);
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = panel.current;
    element.querySelector("button, a, input")?.focus();
    const key = (event) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const items = [...element.querySelectorAll("button:not(:disabled),a[href],input:not(:disabled)")];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); previous.current?.focus(); };
  }, [onClose]);
  return <motion.div className="dialog-shade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .2 }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.section ref={panel} className={`dialog ${className}`} role="dialog" aria-modal="true" aria-label={label} initial={{ opacity: 0, y: reduced ? 0 : 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 10 }} transition={{ duration: reduced ? 0 : .25 }}>
      <IconButton label="Fechar" className="dialog-close" onClick={onClose}><X size={20} /></IconButton>
      {children}
    </motion.section>
  </motion.div>;
}

const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

function SongView({ room, sound }) {
  const data = dedications[room];
  return <div className="song-view">
    <p className="eyebrow">DEDICAÇÃO {data.number}</p>
    <div className={`large-record ${sound.playing && data.audioUrl ? "is-playing" : ""}`}>
      <div className="vinyl-grooves" />
      <div className="vinyl-center" style={data.cover ? { backgroundImage: `url(${data.cover})` } : {}}>{!data.cover && <Moon size={30} strokeWidth={1} />}<i /></div>
    </div>
    <h2>{data.song}</h2>
    <p className="song-artist">{data.artist || "Uma música reservada para você"}</p>
    <p className="song-dedication">{data.title}</p>
    <div className="playback">
      <IconButton label={sound.playing ? "Pausar música" : "Ouvir música"} className="play-button" disabled={!data.audioUrl} onClick={() => sound.toggleTrack(data.audioUrl)}>{sound.playing ? <Pause size={24} /> : <Play size={24} />}</IconButton>
      {data.audioUrl ? <div className="track-timeline"><input aria-label="Posição da música" type="range" min="0" max={sound.duration || 1} value={Math.min(sound.time, sound.duration || 1)} onChange={e => sound.seek(Number(e.target.value))} /><div><span>{formatTime(sound.time)}</span><span>{formatTime(sound.duration)}</span></div></div> : <span className="soon-note">A trilha desta sala chega em breve.</span>}
    </div>
    {sound.error && <p className="audio-error" role="alert">{sound.error}</p>}
    {data.spotifyUrl && <a className="text-action" href={data.spotifyUrl} target="_blank" rel="noreferrer">Ouvir no Spotify <ArrowRight size={16} /></a>}
  </div>;
}

function LetterView({ room, welcome }) {
  const data = dedications[room];
  return <div className="letter-view"><div className="letter-ornament"><span /><Moon size={23} strokeWidth={1} /><span /></div>
    <p className="eyebrow">{welcome ? "QUE BOM QUE VOCÊ CHEGOU" : `UMA CARTA, ${data.number}`}</p>
    <h2>{welcome ? "Pode entrar.\nEu te esperava." : data.title}</h2>
    <p className="handwritten-note">{welcome ? "Deixei algumas músicas e pequenos carinhos escondidos por esse castelo. Tudo foi preparado pensando em você. Fique à vontade, a noite é sua." : data.note}</p>
    <p className="letter-signature">{gift.signature}</p><div className="seal-large"><Moon size={25} strokeWidth={1} /></div>
  </div>;
}

function PhotoView({ room }) {
  const data = dedications[room];
  return <div className="photo-view"><p className="eyebrow">LEMBRANÇA {data.number}</p><div className="antique-photo"><img src={data.photo || scenes[room].image} alt={data.photo ? data.caption : `Ilustração de ${scenes[room].title}`} /><span className="photo-pin" /></div><h2>{data.caption}</h2><p>Algumas coisas merecem ficar guardadas.</p></div>;
}

function BirthdayView() {
  const [opened, setOpened] = useState(false);
  if (!opened) return <div className="gift-view"><p className="eyebrow">ESSA PARTE É SÓ SUA</p><h2>Guardei uma última<br />surpresa.</h2><button className="gift-opening" onClick={() => setOpened(true)} aria-label="Desembrulhar presente"><Prop kind="gift" /><span><Sparkles size={20} /></span></button><p>Feito de músicas, lembranças<br />e um pouquinho de coragem.</p><button className="primary-action" onClick={() => setOpened(true)}>Desembrulhar <Gift size={17} /></button></div>;
  return <div className="birthday-view"><div className="letter-ornament"><span /><Sparkles size={25} strokeWidth={1} /><span /></div><p className="eyebrow">QUE A VIDA TE TRAGA COISAS BONITAS</p><h2>Feliz aniversário{gift.recipient ? `,\n${gift.recipient}` : ""}.</h2><div className="birthday-letter">{gift.letter.map(p => <p key={p}>{p}</p>)}</div><p className="letter-signature">{gift.signature}</p>
    <div className="playlist-gift"><div className="playlist-cover" style={{ backgroundImage: `url(${gift.playlistCover || scenes.exterior.image})` }}><Moon size={22} /><span>uma noite<br />só sua</span></div><div><p className="eyebrow">SUA PLAYLIST</p><h3>{gift.playlistTitle}</h3><p>Para levar um pedacinho desta noite.</p></div></div>
    {gift.playlistUrl ? <a className="primary-action" href={gift.playlistUrl} target="_blank" rel="noreferrer"><Music2 size={18} /> Abrir sua playlist <ArrowRight size={17} /></a> : <button className="primary-action" disabled><Music2 size={18} /> Sua playlist chega em breve</button>}
  </div>;
}

function Journal({ discoveries, navigate, onClose, onReset }) {
  return <div className="journal-view"><p className="eyebrow">O SEU PEQUENO DIÁRIO</p><h2>O que a noite<br />guardou.</h2><div className="journal-list">{musicRooms.map((id, i) => <button className="journal-entry" key={id} onClick={() => { onClose(); navigate(id); }}><span className="journal-number">0{i + 1}</span><span><strong>{scenes[id].title}</strong><small>{discoveries.includes(id) ? "Música encontrada" : "Uma descoberta à sua espera"}</small></span>{discoveries.includes(id) ? <Check size={17} /> : <ArrowRight size={17} />}</button>)}</div><button className="journal-present" onClick={() => { onClose(); navigate("secret"); }}><Gift size={22} /><span>Seu presente de aniversário</span><ArrowRight size={18} /></button><button className="text-action reset-action" onClick={onReset}><RotateCcw size={14} /> Recomeçar as descobertas</button></div>;
}

export default function App() {
  const [scene, setScene] = useState(sceneFromHash);
  const [discoveries, setDiscoveries] = useState(readDiscoveries);
  const [overlay, setOverlay] = useState(null);
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(() => new Set());
  const toastTimer = useRef(null);
  const reduced = useReducedMotion();
  const sound = useSound();
  const current = scenes[scene];
  const close = useCallback(() => setOverlay(null), []);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(discoveries)); } catch { /* Saving is optional in private browsing. */ }
  }, [discoveries]);

  useEffect(() => {
    Object.values(scenes).forEach(s => { const image = new window.Image(); image.src = window.devicePixelRatio > 1 ? s.image.replace(".webp", "-detail.webp") : s.image; });
    const back = () => { sound.pause(); setScene(sceneFromHash()); setOverlay(null); };
    window.addEventListener("popstate", back);
    return () => { window.removeEventListener("popstate", back); clearTimeout(toastTimer.current); };
  }, []);

  const announce = (message) => {
    setToast(message); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  };

  const navigate = (id) => {
    if (!scenes[id] || id === scene) return;
    sound.chime(); sound.pause(); setOverlay(null);
    history.pushState({ room: id }, "", `#${id}`);
    setScene(id);
  };

  const select = (spot) => {
    if (spot.to) { navigate(spot.to); return; }
    sound.chime();
    if (spot.type === "song" && !discoveries.includes(scene)) {
      const next = [...discoveries, scene];
      setDiscoveries(next);
      announce(next.length === 4 ? "As quatro músicas são suas. Seu presente está na sala de estar." : "Uma música guardada no seu diário.");
    }
    setOverlay({ type: spot.type, room: scene });
  };

  return <main className={`castle-game ${scene === "exterior" ? "at-entrance" : "inside-castle"}`}>
    <AnimatePresence mode="wait"><motion.div key={scene} className="scene-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .55 }}><Scene id={scene} discoveries={discoveries} onSelect={select} onReady={() => setLoaded(previous => new Set(previous).add(scene))} mood={overlay?.type} /></motion.div></AnimatePresence>
    <div className="top-shade" aria-hidden="true" /><div className="bottom-shade" aria-hidden="true" />
    <header className="game-header"><div className="header-left">{scene !== "exterior" ? <IconButton label={scene === "hall" ? "Voltar aos portões" : "Voltar à sala de estar"} onClick={() => navigate(scene === "hall" ? "exterior" : "hall")}><ArrowLeft size={19} /></IconButton> : <span className="crest"><Moon size={22} strokeWidth={1.2} /></span>}<span className="brand">À MEIA-NOITE</span></div><div className="header-tools"><IconButton label={sound.enabled ? "Desligar som" : "Ligar som"} aria-pressed={sound.enabled} onClick={sound.toggleSound}>{sound.enabled ? <Volume2 size={19} /> : <VolumeX size={19} />}</IconButton>{scene !== "exterior" && <IconButton label="Abrir diário" onClick={() => setOverlay({ type: "journal" })}><BookOpen size={19} /></IconButton>}</div></header>
    {scene !== "exterior" && <div className="room-heading" key={scene}><p className="eyebrow">{current.subtitle}</p><h1>{current.title}</h1><span className="heading-rule" /></div>}
    {scene === "exterior" && <section className="entrance-copy"><div className="entrance-ornament"><span /><Sparkles size={18} strokeWidth={1} /><span /></div><p className="eyebrow">UM PRESENTE DE ANIVERSÁRIO</p><h1>Hoje, o castelo<br />é seu.</h1><p>Há músicas e pequenos carinhos<br />esperando atrás dessas portas.</p><button className="primary-action" onClick={() => navigate("hall")}>Entrar no castelo <DoorOpen size={18} /></button><span className="entrance-signature">uma noite preparada para você</span></section>}
    {scene !== "exterior" && <footer className="game-footer"><button className="discovery-counter" aria-label={`${discoveries.length} de 4 músicas descobertas. Abrir diário`} onClick={() => setOverlay({ type: "journal" })}><span className="candle-row">{musicRooms.map(id => <Candle key={id} lit={discoveries.includes(id)} label={discoveries.includes(id) ? "Descoberta" : "Não descoberta"} />)}</span><span>{discoveries.length}<i>/</i>4</span></button><span className="footer-whisper">{scene === "hall" && discoveries.length === 4 ? "Seu presente está esperando." : scene === "secret" ? "Feito com carinho." : "Toda porta guarda alguma coisa."}</span>{scene === "hall" && <IconButton label="Ir para seu presente" className={discoveries.length === 4 ? "gift-ready" : ""} onClick={() => navigate("secret")}><Gift size={20} /></IconButton>}</footer>}
    <AnimatePresence>{toast && !overlay && <motion.div className="discovery-toast" role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Sparkles size={16} />{toast}</motion.div>}</AnimatePresence>
    {!loaded.has(scene) && <div className="loading-scene" role="status"><Moon size={22} /><span>Abrindo as portas…</span></div>}
    <AnimatePresence>{overlay && <Dialog label={overlay.type === "journal" ? "Seu diário" : overlay.type === "gift" ? "Seu presente de aniversário" : "Uma descoberta"} onClose={close} className={overlay.type === "note" || overlay.type === "welcome" || overlay.type === "gift" ? "paper-dialog" : ""}>
      {overlay.type === "song" && <SongView room={overlay.room} sound={sound} />}
      {(overlay.type === "note" || overlay.type === "welcome") && <LetterView room={overlay.room} welcome={overlay.type === "welcome"} />}
      {overlay.type === "photo" && <PhotoView room={overlay.room} />}
      {overlay.type === "gift" && <BirthdayView />}
      {overlay.type === "journal" && <Journal discoveries={discoveries} navigate={navigate} onClose={close} onReset={() => { setDiscoveries([]); close(); navigate("exterior"); }} />}
    </Dialog>}</AnimatePresence>
    <span className="live-discoveries sr-only" aria-live="polite">{toast}</span>
  </main>;
}
