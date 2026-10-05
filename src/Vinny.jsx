import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const CELL_WIDTH = 192;
const CELL_HEIGHT = 208;
const animations = {
  idle: { row: 0, frames: [280, 110, 110, 140, 140, 320] },
  right: { row: 1, frames: [120, 120, 120, 120, 120, 120, 120, 220] },
  left: { row: 2, frames: [120, 120, 120, 120, 120, 120, 120, 220] },
  waving: { row: 3, frames: [140, 140, 140, 280] },
  jumping: { row: 4, frames: [140, 140, 140, 140, 280] },
  failed: { row: 5, frames: [140, 140, 140, 140, 140, 140, 140, 240] },
  waiting: { row: 6, frames: [150, 150, 150, 150, 150, 260] },
  working: { row: 7, frames: [120, 120, 120, 120, 120, 220] },
  review: { row: 8, frames: [150, 150, 150, 150, 150, 280] },
};

let sheetPromise;
function loadSheet() {
  if (!sheetPromise) {
    sheetPromise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => { sheetPromise = null; reject(new Error("Vinny sprite could not load")); };
      image.src = "/pet/vinny.webp";
    });
  }
  return sheetPromise;
}

function setAnimation(actor, mode, until = 0) {
  if (actor.mode !== mode) { actor.mode = mode; actor.frame = 0; actor.frameStarted = performance.now(); }
  actor.until = until;
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function Vinny({ width, height, focus, viewport, command, mood, visible, active }) {
  const button = useRef(null);
  const canvas = useRef(null);
  const reduced = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const actor = useRef({ x: 0, y: 0, mode: "waving", frame: 0, frameStarted: 0, until: 0, pending: null, look: null });
  const oldSize = useRef(null);
  const failed = useRef(false);
  const handledCommand = useRef(null);
  const previousMood = useRef(mood);

  useLayoutEffect(() => {
    const pet = actor.current;
    if (oldSize.current) {
      pet.x = pet.x / oldSize.current.width * width;
      pet.y = pet.y / oldSize.current.height * height;
      pet.pending = null;
      setAnimation(pet, "idle");
    } else {
      pet.x = width * clamp(focus - .065, .15, .85);
      pet.y = height * .835;
      setAnimation(pet, "waving", performance.now() + 950);
    }
    oldSize.current = { width, height };
    if (button.current) button.current.style.transform = `translate3d(${pet.x}px, ${pet.y}px, 0)`;
  }, [width, height, focus]);

  useEffect(() => {
    if (!command || handledCommand.current === command || !active) return;
    handledCommand.current = command;
    const pet = actor.current;
    const target = {
      x: clamp(command.x, 44, width - 44),
      y: clamp(command.y, height * .65, height * .845),
    };
    pet.look = null;
    if (reduced || failed.current) {
      pet.x = target.x; pet.y = target.y; pet.pending = null;
      button.current.style.transform = `translate3d(${pet.x}px, ${pet.y}px, 0)`;
      command.onArrive?.();
      return;
    }
    const distance = Math.hypot(target.x - pet.x, target.y - pet.y);
    const element = viewport.current;
    const follow = pet.x < element.scrollLeft + 35 || pet.x > element.scrollLeft + element.clientWidth - 35 || target.x < element.scrollLeft + 35 || target.x > element.scrollLeft + element.clientWidth - 35;
    pet.pending = {
      startX: pet.x, startY: pet.y, ...target,
      started: performance.now(), duration: clamp(distance / 250 * 1000, 220, 1600),
      onArrive: command.onArrive, follow,
    };
    setAnimation(pet, target.x >= pet.x ? "right" : "left");
  }, [command, reduced, width, height, viewport, active]);

  useEffect(() => {
    if (!active) actor.current.pending = null;
  }, [active]);

  useEffect(() => {
    const pet = actor.current;
    if (previousMood.current === mood) return;
    previousMood.current = mood;
    pet.pending = null;
    pet.look = null;
    const mode = mood === "photo" || mood === "note" ? "review" : mood === "song" || mood === "gift" ? "jumping" : mood === "welcome" ? "waving" : "idle";
    setAnimation(pet, mode, mode === "jumping" || mode === "waving" ? performance.now() + 1000 : 0);
  }, [mood]);

  useEffect(() => {
    const element = viewport.current;
    const observe = (event) => {
      if (event.pointerType !== "mouse" || actor.current.pending || mood || reduced) return;
      const rectangle = element.querySelector(".scene-canvas").getBoundingClientRect();
      const dx = event.clientX - rectangle.left - actor.current.x;
      const dy = event.clientY - rectangle.top - (actor.current.y - button.current.offsetHeight * .55);
      if (Math.hypot(dx, dy) < 45) { actor.current.look = null; return; }
      const angle = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2);
      actor.current.look = Math.round(angle / (Math.PI / 8)) % 16;
    };
    const reset = () => { actor.current.look = null; };
    element.addEventListener("pointermove", observe);
    element.addEventListener("pointerleave", reset);
    return () => { element.removeEventListener("pointermove", observe); element.removeEventListener("pointerleave", reset); };
  }, [viewport, mood, reduced]);

  useEffect(() => {
    let stopped = false;
    let animationFrame;
    let lastCell = "";
    const context = canvas.current.getContext("2d");
    context.imageSmoothingEnabled = false;
    loadSheet().then(image => {
      if (stopped) return;
      setLoaded(true);
      const tick = (now) => {
        if (stopped) return;
        const pet = actor.current;
        const movement = pet.pending;
        if (movement) {
          const progress = Math.min(1, (now - movement.started) / movement.duration);
          pet.x = movement.startX + (movement.x - movement.startX) * progress;
          pet.y = movement.startY + (movement.y - movement.startY) * progress;
          if (movement.follow) {
            const element = viewport.current;
            const target = clamp(pet.x - element.clientWidth / 2, 0, element.scrollWidth - element.clientWidth);
            element.scrollLeft += (target - element.scrollLeft) * .12;
          }
          button.current.style.transform = `translate3d(${pet.x}px, ${pet.y}px, 0)`;
          if (progress === 1) {
            pet.pending = null;
            setAnimation(pet, "idle");
            movement.onArrive?.();
          }
        }
        if (pet.until && now >= pet.until && !pet.pending) setAnimation(pet, "idle");
        const animation = animations[reduced ? "idle" : pet.mode];
        if (!pet.frameStarted) pet.frameStarted = now;
        if (!reduced && now - pet.frameStarted >= animation.frames[pet.frame]) {
          pet.frame = (pet.frame + 1) % animation.frames.length;
          pet.frameStarted = now;
        }
        let row = animation.row;
        let column = reduced ? 0 : pet.frame;
        if (pet.look !== null && pet.mode === "idle" && !reduced) {
          row = pet.look < 8 ? 9 : 10;
          column = pet.look % 8;
        }
        const key = `${row}:${column}`;
        if (key !== lastCell) {
          context.clearRect(0, 0, CELL_WIDTH, CELL_HEIGHT);
          context.drawImage(image, column * CELL_WIDTH, row * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT, 0, 0, CELL_WIDTH, CELL_HEIGHT);
          lastCell = key;
          button.current.dataset.animation = pet.mode;
          button.current.dataset.spriteCell = key;
        }
        animationFrame = requestAnimationFrame(tick);
      };
      animationFrame = requestAnimationFrame(tick);
    }).catch(() => {
      if (stopped) return;
      failed.current = true;
      setLoaded(false);
      const pending = actor.current.pending;
      actor.current.pending = null;
      pending?.onArrive?.();
    });
    return () => { stopped = true; cancelAnimationFrame(animationFrame); };
  }, [viewport, reduced]);

  return <button ref={button} type="button" className={`vinny ${loaded && visible ? "vinny-ready" : ""}`} aria-label="Vinny, sua companhia no castelo" title="Vinny" onClick={() => {
    const pet = actor.current;
    pet.pending = null; pet.look = null;
    setAnimation(pet, pet.mode === "waving" ? "jumping" : "waving", performance.now() + 1050);
  }}><span className="vinny-ground" aria-hidden="true" /><canvas ref={canvas} width={CELL_WIDTH} height={CELL_HEIGHT} aria-hidden="true" /></button>;
}
