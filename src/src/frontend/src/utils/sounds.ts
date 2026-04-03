/**
 * Sound feedback using the Web Audio API — no external files required.
 * All tones are synthesized in-browser and last 1-2 seconds.
 * Falls back to vibration + visual flash if audio is unavailable.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function playTone(
  freqs: number[],
  durations: number[],
  gainPeak: number,
  gap = 0,
) {
  const ac = getCtx();
  if (!ac) return;

  let offset = ac.currentTime;
  freqs.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, offset);

    const dur = durations[i] ?? 0.15;
    gain.gain.setValueAtTime(0, offset);
    gain.gain.linearRampToValueAtTime(gainPeak, offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, offset + dur);

    osc.start(offset);
    osc.stop(offset + dur + 0.01);

    offset += dur + gap;
  });
}

function vibrate(pattern: number[]) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/** Short ping — mechanic found / accepted */
export function playMechanicFound() {
  playTone([880, 1100], [0.15, 0.25], 0.25, 0.03);
  vibrate([80]);
}

/** Slightly stronger double chime — price quote received */
export function playPriceUpdate() {
  playTone([660, 880, 1100], [0.12, 0.12, 0.3], 0.35, 0.04);
  vibrate([60, 40, 80]);
}

/** Alert repeated once — new request on mechanic side */
export function playNewRequest() {
  playTone([1000, 1200, 1000, 1200], [0.12, 0.12, 0.12, 0.2], 0.3, 0.04);
  vibrate([100, 60, 100]);
}

/** Soft single chime — job status changes (on the way / arrived / completed) */
export function playSoftNotification() {
  playTone([740], [0.4], 0.2);
  vibrate([50]);
}
