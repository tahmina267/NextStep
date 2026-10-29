// Small Web Audio sounds for reminders and alarms in the browser, so no audio files are needed.
// Browsers only allow sound after the user has interacted with the page, so the audio context
// is created and unlocked on the first tap or key press
let ctx: AudioContext | null = null;

const getContext = () => {
    if (ctx) return ctx;
    const scope = globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctor = scope.AudioContext ?? scope.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
};

if (typeof document !== "undefined") {
    const unlock = () => {
        getContext()?.resume().catch(() => {});
    };
    document.addEventListener("pointerdown", unlock, { capture: true });
    document.addEventListener("keydown", unlock, { capture: true });
}

const beep = (frequency: number, start: number, length: number, volume = 0.18) => {
    const audio = getContext();
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    const t = audio.currentTime + start;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + length + 0.05);
};

// Two soft notes, like a notification
export const playChime = () => {
    beep(880, 0, 0.35);
    beep(1320, 0.18, 0.45);
};

// Repeating beep-beep until the returned function is called
export const startAlarmSound = () => {
    const ring = () => {
        beep(988, 0, 0.18, 0.25);
        beep(988, 0.25, 0.18, 0.25);
        beep(988, 0.5, 0.18, 0.25);
    };
    ring();
    const timer = setInterval(ring, 1200);
    return () => clearInterval(timer);
};
