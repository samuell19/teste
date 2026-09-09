import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import dinnerAndDiatribes from "../Hozier-Dinner-Diatribes-Audio.m4a";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mojgpvoy";
const AUDIO_TRACK_URL = dinnerAndDiatribes;

const assets = {
  lock: "/assets/figma/lock.svg",
  speaker: "/assets/figma/speaker.svg",
  waveform: "/assets/figma/waveform.svg",
  evidenceTicket: "/assets/figma/evidence-ticket.png",
  evidenceAmpoule: "/assets/figma/evidence-ampoule.png",
  evidenceFilm: "/assets/figma/evidence-film.png",
  fingerprint: "/assets/figma/fingerprint.svg",
  radar: "/assets/figma/radar.svg",
  biohazard: "/assets/figma/biohazard.svg",
  reticle: "/assets/figma/reticle.svg",
  cinemaRoom: "/assets/figma/cinema-room.png",
  popcorn: "/assets/figma/popcorn.png",
  cinemaHero: "/assets/figma/cinema-hero.png",
  finalCinema: "/assets/figma/final-cinema.png",
  ticketIcon: "/assets/figma/ticket-icon.svg",
  maskIcon: "/assets/figma/mask-icon.svg",
  shield: "/assets/figma/shield.svg",
  calendar: "/assets/figma/calendar.svg",
  download: "/assets/figma/download.svg",
};

const stages = [
  "01 • INICIALIZAÇÃO",
  "02 • AUDIO_CORE",
  "03 • EVIDÊNCIAS",
  "04 • TARGET_LOCKED",
  "05 • CREDENCIAL",
  "06 • MISSION ACCEPTED",
];

const evidence = [
  {
    code: "#01_TCKT",
    tag: "DOC_CLR // LEVEL_01",
    subtag: "IMAX_70MM",
    title: "EVIDÊNCIA A:",
    title2: "TELA GRANDE",
    detail: "Status: Decodificado - tela gigante garantida.",
    metaA: "SECTOR: AUD-07",
    metaB: "PERFORATION: VERIFIED",
    image: assets.evidenceTicket,
  },
  {
    code: "#02_BIO",
    tag: "MUTAGEN // SEC_V",
    subtag: "VIRAL_T",
    title: "EVIDÊNCIA B:",
    title2: "T-SPECIMEN",
    detail: "Status: Possíveis criaturas biologicamente questionáveis.",
    metaA: "CONTAINMENT: 94%",
    metaB: "RISCO // ELEVADO",
    image: assets.evidenceAmpoule,
  },
  {
    code: "#03_FILM",
    tag: "EXPOSURE // 24FPS",
    subtag: "BUTTER_CRACK",
    title: "EVIDÊNCIA C:",
    title2: "FOTOGRAMA",
    detail: "Status: Pipoca provavelmente envolvida.",
    metaA: "RATION: BUTTER_CARAMEL",
    metaB: "SNACK_STATION: ARMED",
    image: assets.evidenceFilm,
  },
];

const barcodeBars = [2, 6, 0, 4, 8, 0, 4, 2, 8, 0, 4, 6];
const waveBars = [8, 16, 24, 12, 28, 20, 8, 24, 32, 16, 12, 20, 28, 20, 8, 24, 16, 8, 24, 12];
const miniWave = [12, 20, 8, 24, 32, 20, 28, 16, 12, 24, 32, 20, 28, 16, 8, 20, 28, 24, 16, 12, 24, 32, 16, 8, 20, 12, 8];

const screenVariants = {
  enter: { opacity: 0, y: 28, scale: 0.985, filter: "blur(10px)" },
  center: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -24, scale: 1.015, filter: "blur(8px)" },
};

function notify(resposta, extras = {}) {
  return fetch(FORMSPREE_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resposta,
      convite: "Resident Evil Cinema Date Experience",
      quando: "Sábado, 20:30",
      onde: "Cinemark Prime",
      ...extras,
    }),
  }).catch(() => {});
}

function useAmbientAudio() {
  const audioRef = useRef(null);
  const synthRef = useRef(null);
  const [audioOn, setAudioOn] = useState(false);

  const startSynth = () => {
    if (synthRef.current) {
      setAudioOn(true);
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const master = ctx.createGain();
    const low = ctx.createOscillator();
    const pulse = ctx.createOscillator();
    const tremolo = ctx.createOscillator();
    const tremoloGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    low.type = "sine";
    low.frequency.value = 55;
    pulse.type = "triangle";
    pulse.frequency.value = 110;
    tremolo.type = "sine";
    tremolo.frequency.value = 0.18;
    tremoloGain.gain.value = 0.018;
    filter.type = "lowpass";
    filter.frequency.value = 420;
    master.gain.value = 0.0001;

    low.connect(filter);
    pulse.connect(filter);
    tremolo.connect(tremoloGain);
    tremoloGain.connect(master.gain);
    filter.connect(master);
    master.connect(ctx.destination);

    low.start();
    pulse.start();
    tremolo.start();
    master.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 1.2);

    synthRef.current = { ctx, master, nodes: [low, pulse, tremolo] };
    setAudioOn(true);
  };

  const start = () => {
    if (audioRef.current || synthRef.current) {
      setAudioOn(true);
      return;
    }

    const track = new Audio(AUDIO_TRACK_URL);
    track.loop = true;
    track.volume = 0.82;
    track
      .play()
      .then(() => {
        audioRef.current = track;
        setAudioOn(true);
      })
      .catch(() => {
        startSynth();
      });
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setAudioOn(false);
      return;
    }

    const audio = synthRef.current;
    if (audio) {
      audio.master.gain.exponentialRampToValueAtTime(0.0001, audio.ctx.currentTime + 0.4);
      window.setTimeout(() => {
        audio.nodes.forEach((node) => node.stop());
        audio.ctx.close();
        synthRef.current = null;
        setAudioOn(false);
      }, 450);
    }
  };

  return { audioOn, start, stop };
}

function Header({ stage, audioOn, onToggleAudio }) {
  return (
    <header className="hud header">
      <div className="hud-left">
        <span className="live-dot" />
        <span>FILE // RE-DATE-EXP</span>
      </div>
      <button className="audio-chip" onClick={onToggleAudio} type="button">
        <span className="equalizer" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>{audioOn ? "00:12" : "OFF"}</span>
      </button>
      <span className="sr-only">{stage}</span>
    </header>
  );
}

function Footer({ stage }) {
  return (
    <footer className="hud footer">
      <span>SYSTEM // 390x844_OPT</span>
      <span>REC [●]</span>
      <span className="footer-stage">{stage}</span>
    </footer>
  );
}

function Shell({ children, stage, audioOn, onToggleAudio, tall = false }) {
  return (
    <main className={`experience ${tall ? "experience-tall" : ""}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="scan-noise" />
      <Header stage={stage} audioOn={audioOn} onToggleAudio={onToggleAudio} />
      <AnimatePresence mode="wait">
        <motion.section
          key={stage}
          animate="center"
          className="screen"
          exit="exit"
          initial="enter"
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          variants={screenVariants}
        >
          {children}
        </motion.section>
      </AnimatePresence>
      <Footer stage={stage} />
    </main>
  );
}

function TerminalPill({ children }) {
  return (
    <span className="terminal-pill">
      <img alt="" src={assets.lock} />
      {children}
    </span>
  );
}

function Waveform({ variant = "large" }) {
  const bars = variant === "mini" ? miniWave : waveBars;
  return (
    <div className={`wave-bars ${variant}`}>
      {bars.map((height, index) => (
        <motion.span
          key={`${height}-${index}`}
          animate={{ height: [height, Math.max(8, height + (index % 4) * 4), height] }}
          transition={{
            duration: 1.2 + (index % 5) * 0.12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function BootScreen({ onNext }) {
  return (
    <div className="boot-screen">
      <div className="micro-row top-row">
        <span className="chip"><span className="live-dot" />FILE_001 // RE-EVO</span>
        <span className="chip">STATUS: READY <span className="live-dot pale" /></span>
      </div>
      <div className="boot-copy">
        <TerminalPill>TRANSMISSÃO PRIVADA</TerminalPill>
        <h1>
          prometi que ia
          <br />
          fazer isso
        </h1>
        <h2>
          de um jeito
          <br />
          mais legal.
        </h2>
        <div className="archive-line">
          <i />
          <span>ARCHIVE-SEQ.440</span>
          <i />
        </div>
        <button className="primary wide" onClick={onNext} type="button">
          <span>[</span> COMEÇAR <span>]</span>
        </button>
        <p className="hint">TOQUE PARA INICIAR DESCRIPTOGRAFIA</p>
      </div>
      <div className="micro-row bottom-row">
          <span><span className="live-dot muted" />01 • INICIALIZAÇÃO</span>
        <span>FRM // 24FPS</span>
      </div>
    </div>
  );
}

function AudioScreen({ onNext }) {
  return (
    <div className="audio-screen">
      <div className="micro-bar">
        <span><span className="live-dot" />CANAL 02 // AUDIO_CORE</span>
        <span className="playing">
          <span className="equalizer" aria-hidden="true"><i /><i /><i /></span>
          00:14 PLAYING
        </span>
      </div>
      <div className="headline centered">
        <span>MEMÓRIA ACÚSTICA</span>
        <h2>isso aqui precisava</h2>
        <h3>da trilha certa.</h3>
      </div>
      <div className="turntable-wrap">
        <motion.div
          animate={{ rotate: 360 }}
          className="vinyl"
          transition={{ duration: 8, ease: "linear", repeat: Infinity }}
        >
          <span className="groove g1" />
          <span className="groove g2" />
          <span className="groove g3" />
          <span className="groove g4" />
          <div className="label">
            <i />
            <strong>HOZIER</strong>
            <small>DINNER CUT</small>
          </div>
        </motion.div>
        <span className="tonearm" />
      </div>
      <img className="wave-svg" alt="" src={assets.waveform} />
      <div className="track-card">
        <div><span>TRACK:</span> DINNER & DIATRIBES</div>
        <strong>03:44</strong>
        <div><span>ARTIST:</span> HOZIER</div>
        <em>HI-RES STEREO</em>
      </div>
      <button className="primary wide" onClick={onNext} type="button">
        <span aria-hidden="true">▶</span> [ TOCAR DINNER & DIATRIBES ]
      </button>
      <div className="transport-meta">
        <span>DECIBEL RATIO: 94.2 dB</span>
        <span>SYNC: ANALOG TAPE</span>
      </div>
    </div>
  );
}

function EvidenceCard({ item, index }) {
  return (
    <motion.article
      className="evidence-card"
      initial={{ opacity: 0, x: -22 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12 * index }}
    >
      <div className="evidence-art">
        <span>{item.code}</span>
        <img alt="" src={item.image} />
        <i>{index === 1 ? "BIO-HAZ" : index === 2 ? "35MM" : "•••"}</i>
      </div>
      <div className="evidence-body">
        <div className="tags">
          <span>{item.tag}</span>
          <b>{item.subtag}</b>
          <img alt="" src={assets.lock} />
        </div>
        <h3>
          {item.title}
          <br />
          {item.title2}
        </h3>
        <p>{item.detail}</p>
        <div className="meta-pair">
          <span>{item.metaA}</span>
          <span>{item.metaB}</span>
        </div>
      </div>
    </motion.article>
  );
}

function EvidenceScreen({ onNext }) {
  return (
    <div className="evidence-screen scrollable-content">
      <div className="section-heading left">
        <span><span className="live-dot" />EVIDENCE_ANALYSIS // PHASE_02</span>
        <h2>
          ok. agora falta descobrir
          <br />
          <b>o resto do plano.</b>
        </h2>
        <p><img alt="" src={assets.fingerprint} />toque nas evidências para decodificar.</p>
      </div>
      <div className="audio-log">
        <div>
          <span>AUDIO_LOG // FREQ_44.1kHz</span>
          <strong>02:14 / 03:00</strong>
        </div>
        <Waveform variant="mini" />
        <div>
          <span>CH_01_SURROUND</span>
          <strong>RADIAL_SYNC ACTIVE</strong>
        </div>
      </div>
      <div className="evidence-list">
        {evidence.map((item, index) => (
          <EvidenceCard item={item} index={index} key={item.code} />
        ))}
      </div>
      <p className="obvious">[ acho que ficou meio óbvio, né? ]<br />3/3 CLUES ANALYZED</p>
      <button className="primary block" onClick={onNext} type="button">
        ⦿ [ ANALISAR DESTINO ] &gt;
      </button>
    </div>
  );
}

function RevealScreen({ onNext }) {
  return (
    <div className="reveal-screen scrollable-content">
      <div className="diag">
        <span><i />SYS.DIAG // TARGET_LOCKED</span>
        <span>GRID: 390x844 :: SECTOR-07</span>
      </div>
      <section className="radar-card">
        <div className="radar-head">
          <span><img alt="" src={assets.radar} />BIO-ANALYSIS IN PROGRESS</span>
          <b>FPS: 59.9</b>
        </div>
        <div className="reticle">
          <img alt="" src={assets.reticle} />
          <motion.span
            animate={{ y: [0, 154, 0] }}
            className="laser"
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <em>SCANNING DESTINATION...</em>
          <small>TARGET: UMBRELLA_THEATRE</small>
        </div>
        <div className="resident-title">
          <span>ARCHIVAL DOSSIER // CLASSIFIED</span>
          <h2>RESIDENT<br />EVIL</h2>
          <p>SURVIVAL HORROR CINEMA DATE</p>
          <b><i />STATUS: PLAN CONFIRMED</b>
        </div>
      </section>
      <div className="photo-grid">
        <figure><img alt="" src={assets.cinemaRoom} /><figcaption>CAM_01 // SALA_04</figcaption></figure>
        <figure><img alt="" src={assets.popcorn} /><figcaption>RATION // POPCORN_SUPPLY</figcaption></figure>
      </div>
      <div className="spec-list">
        <Spec icon={assets.ticketIcon} label="TYPE" value="SESSAO DE CINEMA" />
        <Spec icon={assets.maskIcon} label="GENRE" value="HORROR & TENSÃO" />
        <Spec icon={assets.biohazard} label="BIOHAZARD LEVEL" value="QUESTIONÁVEL" alert />
        <Spec icon={assets.shield} label="SURVIVAL RATE" value="PROBABLY FINE (COM PIPOCA)" alert />
      </div>
      <div className="directive">
        <span>PRIMARY DIRECTIVE</span>
        <h3>SOBREVIVER AO FILME JUNTOS.</h3>
        <p>Mão segurada permitida durante jump scares. Trazer jaqueta adicional para hipotermia de ar-condicionado.</p>
      </div>
      <button className="primary block squared" onClick={onNext} type="button">
        ▣ [ EMITIR CREDENCIAL ] ▻
      </button>
    </div>
  );
}

function Spec({ icon, label, value, alert = false }) {
  return (
    <div className="spec">
      <span><img alt="" src={icon} />{label}</span>
      <b className={alert ? "alert" : ""}>{value}</b>
    </div>
  );
}

function Barcode({ compact = false }) {
  return (
    <div className={`barcode ${compact ? "compact" : ""}`} aria-hidden="true">
      {barcodeBars.map((bar, index) => (
        <span className={bar === 0 ? "empty" : ""} style={{ width: bar || 2 }} key={index} />
      ))}
    </div>
  );
}

function InviteScreen({ onAccept, onDecline, declineCount }) {
  const declineLabels = [
    "[ preciso consultar a corporação ]",
    "[ corporação negou a recusa ]",
    "[ rota de fuga bloqueada ]",
    "[ aceite a missao, agente ]",
  ];

  return (
    <div className="invite-screen">
      <div className="pass-head">
        <span><span className="live-dot" />DECRYPTED // PASS-ID: 704-RC</span>
        <b>PROTOCOL: SURVIVE</b>
      </div>
      <section className="digital-ticket">
        <div className="ticket-main">
          <div className="ticket-title-row">
            <div>
              <span className="special"><img alt="" src={assets.maskIcon} />SPECIAL PASS</span>
              <h2>CINEMA<br />EXPERIENCE</h2>
              <p>RESIDENT EVIL</p>
            </div>
            <div className="mask-box"><img alt="" src={assets.maskIcon} /></div>
          </div>
          <figure className="hero-cinema">
            <img alt="" src={assets.cinemaHero} />
            <figcaption>
              <span>IMAX PRIME IMMERSIVE</span>
              <span>AUDIO 7.1 ATMOS</span>
            </figcaption>
          </figure>
          <div className="ticket-info">
            <span><small>DATA // TIME</small><b>SABADO // 20:30</b></span>
            <span><small>LOCALIZACAO</small><b>CINEMARK PRIME</b></span>
          </div>
          <div className="survival-row">
            <span><i />SURVIVAL UNIT: 02 GUESTS</span>
            <b>ADMIT TWO</b>
          </div>
        </div>
        <div className="ticket-sep" />
        <div className="ticket-auth">
          <div>
            <span>AUTH CODE // UMBRELLA-CLEARANCE</span>
            <strong>SEC-HASH: 994-F42-RACCOON-SEC-02</strong>
            <p>Validação biométrica individual na entrada.</p>
          </div>
          <Barcode compact />
        </div>
      </section>
      <div className="proposal-copy">
        <span>TRANSMISSÃO DIRETA RECEBIDA</span>
        <h2>então...</h2>
        <p>topa ir comigo?</p>
      </div>
      {declineCount > 0 && (
        <motion.div
          className="deny-terminal"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          REQ_DENIED // a corporação não autorizou essa opção.
        </motion.div>
      )}
      <div className="choice-stack">
        <button className="primary block" onClick={onAccept} type="button">
          <img alt="" src={assets.shield} />[ ACEITO A MISSAO ]
        </button>
        <motion.button
          animate={declineCount ? { x: [0, -7, 7, -4, 4, 0] } : false}
          className="secondary block"
          onClick={onDecline}
          type="button"
        >
          <img alt="" src={assets.speaker} />
          {declineLabels[Math.min(declineCount, declineLabels.length - 1)]}
        </motion.button>
      </div>
    </div>
  );
}

function AcceptedScreen() {
  return (
    <div className="accepted-screen">
      <div className="accepted-head">
        <span><span className="live-dot" />STATUS // MISSION ACCEPTED</span>
        <b>CLEARANCE_LVL // 02</b>
      </div>
      <section className="physical-ticket">
        <div className="physical-main">
          <div className="ticket-top">
            <span>PROTOCOL // SPEC-OPS</span>
            <b>SEC // TKT-9941</b>
          </div>
          <h2>CINEMA<br />NIGHT</h2>
          <p>Sessão Reservada • Poltronas Centrais</p>
          <figure>
            <img alt="" src={assets.finalCinema} />
            <figcaption>SALA 04 // IMAX DUAL</figcaption>
          </figure>
          <strong className="stamp">[ CONFIRMADO // ADMIT 2 ]</strong>
          <div className="date-access">
            <span><small>DATA & HORA</small><b>SEX •<br />21:30</b></span>
            <span><small>ACESSO VIP</small><b>2<br />INGRESSOS</b></span>
          </div>
        </div>
        <aside>
          <span>PASS // 02</span>
          <Barcode />
          <small>HEX: #85221F</small>
        </aside>
      </section>
      <div className="done-copy">
        <h2>fechado :)</h2>
        <p>agora era só isso mesmo. promessa cumprida.</p>
      </div>
      <div className="final-wave">
        <div><span><i />AUDIO FREQ // MONITORED</span><b>44.1 kHz</b></div>
        <Waveform variant="mini" />
      </div>
      <div className="final-actions">
        <button onClick={downloadTicket} type="button"><img alt="" src={assets.download} />[ SALVAR INGRESSO ]</button>
        <button onClick={downloadCalendar} type="button"><img alt="" src={assets.calendar} />[ ADICIONAR À AGENDA ]</button>
      </div>
      <p className="transmission-end">TRANSMISSÃO ENCERRADA • VEJO VOCÊ NO CINEMA</p>
    </div>
  );
}

function downloadText(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadTicket() {
  downloadText(
    "resident-evil-cinema-date.txt",
    "MISSION ACCEPTED\nCinema Night - Resident Evil\nSábado // 20:30\nCinemark Prime\nSurvival Unit: 02 guests\n",
    "text/plain;charset=utf-8",
  );
}

function downloadCalendar() {
  downloadText(
    "resident-evil-cinema-date.ics",
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "SUMMARY:Resident Evil Cinema Date",
      "DESCRIPTION:Sobreviver ao filme juntos.",
      "LOCATION:Cinemark Prime",
      "DTSTART:20260912T203000",
      "DTEND:20260912T233000",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n"),
    "text/calendar;charset=utf-8",
  );
}

export default function App() {
  const [stage, setStage] = useState(0);
  const [declineCount, setDeclineCount] = useState(0);
  const { audioOn, start, stop } = useAmbientAudio();
  const currentStage = useMemo(() => stages[stage] ?? stages[0], [stage]);

  useEffect(() => {
    document.documentElement.style.colorScheme = "dark";
  }, []);

  const next = () => {
    if (!audioOn) start();
    setStage((value) => Math.min(value + 1, stages.length - 1));
  };

  const accept = () => {
    notify("aceitou", { mensagem: "Ela aceitou a missao" });
    setStage(5);
  };

  const decline = () => {
    if (declineCount === 0) {
      notify("tentou recusar", { mensagem: "Ela tentou consultar a corporação" });
    }
    setDeclineCount((value) => value + 1);
  };

  const content = [
    <BootScreen onNext={next} />,
    <AudioScreen onNext={next} />,
    <EvidenceScreen onNext={next} />,
    <RevealScreen onNext={next} />,
    <InviteScreen onAccept={accept} onDecline={decline} declineCount={declineCount} />,
    <AcceptedScreen />,
  ][stage];

  return (
    <Shell
      audioOn={audioOn}
      onToggleAudio={audioOn ? stop : start}
      stage={currentStage}
      tall={stage === 2 || stage === 3 || stage === 4 || stage === 5}
    >
      {content}
    </Shell>
  );
}
