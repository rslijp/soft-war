// All sound in the game is made here, with the browser's Web Audio API: nothing is recorded, every
// effect and the music are synthesized while you play. Browsers only allow sound after the player
// clicked or pressed a key, so the audio starts on the first one.
//
// Music and sound effects can each be switched off; that is remembered per browser.

const SETTINGS_KEY = "softwar-sound";
const DEFAULTS = {music: true, effects: true};

let context = null;
let master, musicBus, effectsBus;
let noiseBuffer = null;
const listeners = new Set();

function readSettings() {
    try {
        return {...DEFAULTS, ...JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}")};
    } catch {
        return {...DEFAULTS};
    }
}
let settings = readSettings();

export function soundSettings() {
    return {...settings};
}

export function changeSoundSettings(change) {
    settings = {...settings, ...change};
    try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // storage blocked: the setting only lasts for this page
    }
    if (context) {
        musicBus.gain.setTargetAtTime(settings.music ? 0.32 : 0, context.currentTime, 0.2);
        effectsBus.gain.setTargetAtTime(settings.effects ? 0.9 : 0, context.currentTime, 0.05);
    }
    listeners.forEach(listener => listener(settings));
    return soundSettings();
}

// Called back when the settings change or the audio starts (the music player listens).
export function onSoundChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function audioContext() {
    return context;
}

export function musicOutput() {
    return musicBus;
}

function start() {
    if (context) {
        if (context.state === "suspended") context.resume();
        return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0.8;
    // a gentle compressor keeps explosions from clipping on top of the music
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.ratio.value = 6;
    master.connect(limiter).connect(context.destination);
    musicBus = context.createGain();
    musicBus.gain.value = settings.music ? 0.32 : 0;
    musicBus.connect(master);
    effectsBus = context.createGain();
    effectsBus.gain.value = settings.effects ? 0.9 : 0;
    effectsBus.connect(master);

    noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    listeners.forEach(listener => listener(settings));
}

// The first click or key press anywhere unlocks the audio.
export function installAudioUnlock() {
    const unlock = () => {
        start();
        window.removeEventListener("pointerdown", unlock, true);
        window.removeEventListener("keydown", unlock, true);
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
}

// ------------------------------------------------------------------ building blocks

// A tone with a quick attack and an exponential decay; optionally sliding to another pitch.
export function tone(output, {at, frequency, to, duration = 0.2, type = "square", volume = 0.3, attack = 0.005}) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    if (to) oscillator.frequency.exponentialRampToValueAtTime(to, at + duration);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain).connect(output);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.05);
}

// Filtered noise: engines, explosions, wind, snares, paper.
export function noise(output, {at, duration = 0.2, volume = 0.3, filter = "lowpass", frequency = 1000, to, q = 1, attack = 0.005}) {
    const source = context.createBufferSource();
    source.buffer = noiseBuffer;
    const shape = context.createBiquadFilter();
    shape.type = filter;
    shape.frequency.setValueAtTime(frequency, at);
    if (to) shape.frequency.exponentialRampToValueAtTime(to, at + duration);
    shape.Q.value = q;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(shape).connect(gain).connect(output);
    source.start(at, Math.random() * 1.5);
    source.stop(at + duration + 0.05);
}

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

// ------------------------------------------------------------------ the effects

const EFFECTS = {
    // a crisp switch for buttons and menu items
    click: (out, t) => tone(out, {at: t, frequency: 1800, to: 900, duration: 0.04, volume: 0.12}),

    // picking a unit: a short two-tone radio blip
    select: (out, t) => {
        tone(out, {at: t, frequency: 880, duration: 0.05, volume: 0.1});
        tone(out, {at: t + 0.05, frequency: 1320, duration: 0.06, volume: 0.1});
    },

    // land units: tracks and a diesel thump
    "move-land": (out, t) => {
        noise(out, {at: t, duration: 0.22, volume: 0.25, frequency: 380, to: 160});
        tone(out, {at: t, frequency: 70, to: 48, duration: 0.2, type: "triangle", volume: 0.3});
    },
    // aircraft: a whoosh past
    "move-air": (out, t) => noise(out, {at: t, duration: 0.35, volume: 0.18, filter: "bandpass", frequency: 600, to: 2600, q: 2, attack: 0.08}),
    // ships: a slow wave and a low horn
    "move-sea": (out, t) => {
        noise(out, {at: t, duration: 0.5, volume: 0.15, frequency: 500, to: 220, attack: 0.15});
        tone(out, {at: t + 0.05, frequency: 98, duration: 0.35, type: "sawtooth", volume: 0.06, attack: 0.05});
    },

    // an enemy moving within sight: a softer, deeper step
    "enemy-move": (out, t) => noise(out, {at: t, duration: 0.18, volume: 0.1, frequency: 260, to: 120}),

    // a move that isn't possible
    blocked: (out, t) => tone(out, {at: t, frequency: 110, duration: 0.15, type: "sawtooth", volume: 0.12}),

    // choosing a destination: a rising radio chirp
    "order-mode": (out, t) => tone(out, {at: t, frequency: 600, to: 1600, duration: 0.12, volume: 0.08}),
    // an order confirmed: "roger" (two quick chirps)
    order: (out, t) => {
        tone(out, {at: t, frequency: 1000, to: 1500, duration: 0.07, volume: 0.08});
        tone(out, {at: t + 0.09, frequency: 1000, to: 1500, duration: 0.07, volume: 0.08});
    },

    // a battle: rumble, then a few explosions
    battle: (out, t) => {
        noise(out, {at: t, duration: 0.9, volume: 0.2, frequency: 200, attack: 0.1});
        [0, 0.22, 0.47, 0.66].forEach((d, i) => {
            noise(out, {at: t + d, duration: 0.4, volume: 0.5 - i * 0.06, frequency: 1800, to: 120});
            tone(out, {at: t + d, frequency: 90, to: 35, duration: 0.35, type: "sine", volume: 0.5});
        });
    },
    victory: (out, t) => [72, 76, 79, 84].forEach((n, i) => tone(out, {at: t + 1 + i * 0.09, frequency: NOTE(n), duration: 0.2, type: "triangle", volume: 0.16})),
    defeat: (out, t) => [67, 63, 60].forEach((n, i) => tone(out, {at: t + 1 + i * 0.16, frequency: NOTE(n), duration: 0.3, type: "triangle", volume: 0.16})),

    // a city taken: a short bugle fanfare
    "city-taken": (out, t) => [60, 64, 67, 72, 67, 72].forEach((n, i) =>
        tone(out, {at: t + [0, 0.12, 0.24, 0.36, 0.6, 0.72][i], frequency: NOTE(n), duration: i === 5 ? 0.6 : 0.14, type: "sawtooth", volume: 0.1, attack: 0.02})),
    // a city lost: falling minor
    "city-lost": (out, t) => [64, 60, 57, 52].forEach((n, i) => tone(out, {at: t + i * 0.2, frequency: NOTE(n), duration: 0.35, type: "sawtooth", volume: 0.08, attack: 0.03})),

    // a new unit rolls off the line: ratchet and clank
    produced: (out, t) => {
        [0, 0.05, 0.1, 0.15].forEach(d => noise(out, {at: t + d, duration: 0.04, volume: 0.25, filter: "highpass", frequency: 3000}));
        tone(out, {at: t + 0.22, frequency: 520, to: 480, duration: 0.25, type: "square", volume: 0.07});
    },

    // the enemy in sight: a radar ping
    spotted: (out, t) => {
        tone(out, {at: t, frequency: 1400, duration: 0.5, type: "sine", volume: 0.12, attack: 0.002});
        tone(out, {at: t + 0.25, frequency: 1400, duration: 0.4, type: "sine", volume: 0.05, attack: 0.002});
    },

    // your turn: a drum roll and a bugle call
    "your-turn": (out, t) => {
        for (let i = 0; i < 10; i++) noise(out, {at: t + i * 0.035, duration: 0.05, volume: 0.06 + i * 0.012, filter: "bandpass", frequency: 1800, q: 0.8});
        [67, 72, 76, 72, 79].forEach((n, i) =>
            tone(out, {at: t + 0.4 + i * 0.13, frequency: NOTE(n), duration: i === 4 ? 0.5 : 0.12, type: "sawtooth", volume: 0.09, attack: 0.02}));
    },
    // everything has moved: a two-note chime
    "end-turn": (out, t) => {
        tone(out, {at: t, frequency: NOTE(79), duration: 0.35, type: "triangle", volume: 0.14});
        tone(out, {at: t + 0.16, frequency: NOTE(84), duration: 0.5, type: "triangle", volume: 0.14});
    },

    // an order that needs you, or a plane low on fuel: an alarm
    attention: (out, t) => [0, 0.18].forEach(d => tone(out, {at: t + d, frequency: 740, duration: 0.12, type: "square", volume: 0.08})),
    "out-of-fuel": (out, t) => tone(out, {at: t, frequency: 1600, to: 200, duration: 0.9, type: "sine", volume: 0.12}),

    // a dispatch or dialog opening: paper
    paper: (out, t) => noise(out, {at: t, duration: 0.12, volume: 0.1, filter: "bandpass", frequency: 4000, q: 0.7, attack: 0.02})
};

export const EFFECT_NAMES = Object.keys(EFFECTS);

const lastPlayed = {};

// Plays an effect by name. A burst of the same effect within a short time plays once.
export function play(name, {minGap = 0.06} = {}) {
    if (!context || !settings.effects || !EFFECTS[name]) return false;
    const now = context.currentTime;
    if (lastPlayed[name] !== undefined && now - lastPlayed[name] < minGap) return false;
    lastPlayed[name] = now;
    EFFECTS[name](effectsBus, now + 0.01);
    return true;
}
