// The background music: an original military march in D minor, generated while it plays.
// Two moods: "calm" (bass and chords, for the pages around the game) and "march" (with drums and a
// bugle melody, during a game). A small scheduler plans the notes a little ahead of time.
import {audioContext, musicOutput, noise, onSoundChange, soundSettings, tone} from "./audio";

const TEMPO = 104;              // beats per minute
const BEAT = 60 / TEMPO;
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

// eight bars, one chord each: Dm Dm Bb C | Dm Gm A Dm (as MIDI root, and the chord tones above it)
const PROGRESSION = [
    {root: 38, chord: [62, 65, 69]},
    {root: 38, chord: [62, 65, 69]},
    {root: 34, chord: [62, 65, 70]},
    {root: 36, chord: [64, 67, 72]},
    {root: 38, chord: [62, 65, 69]},
    {root: 43, chord: [62, 67, 70]},
    {root: 33, chord: [61, 64, 69]},
    {root: 38, chord: [62, 65, 69]}
];

// the bugle tune over the second half of every other phrase: [beat in the 4 bars, MIDI note, beats]
const TUNE = [
    [0, 69, 1], [1, 74, 0.5], [1.5, 74, 0.5], [2, 74, 1], [3, 77, 1],
    [4, 76, 1.5], [5.5, 74, 0.5], [6, 72, 2],
    [8, 74, 1], [9, 77, 0.5], [9.5, 77, 0.5], [10, 81, 1], [11, 79, 1],
    [12, 76, 1], [13, 73, 1], [14, 74, 2]
];

let mood = "calm";
let timer = null;
let nextBeatTime = 0;
let beat = 0;           // beats since the start, 4 per bar

function scheduleBeat(t, beatNumber) {
    const out = musicOutput();
    const bar = Math.floor(beatNumber / 4) % PROGRESSION.length;
    const inBar = beatNumber % 4;
    const phrase = Math.floor(beatNumber / (4 * PROGRESSION.length));
    const {root, chord} = PROGRESSION[bar];

    // bass: root on 1 and 3, the fifth on 2 and 4
    tone(out, {at: t, frequency: NOTE(inBar % 2 === 0 ? root : root + 7), duration: BEAT * 0.9, type: "triangle", volume: 0.35, attack: 0.01});

    // chords: a soft pad at the start of every bar
    if (inBar === 0) {
        chord.forEach(n => tone(out, {at: t, frequency: NOTE(n - 12), duration: BEAT * 3.8, type: "triangle", volume: 0.05, attack: 0.3}));
    }

    if (mood !== "march") return;

    // drums: a bass drum on 1 and 3, a snare on 2 and 4 with a march ruff before the next bar
    if (inBar % 2 === 0) tone(out, {at: t, frequency: 120, to: 45, duration: 0.25, type: "sine", volume: 0.5});
    if (inBar % 2 === 1) noise(out, {at: t, duration: 0.14, volume: 0.22, filter: "bandpass", frequency: 1900, q: 0.9});
    if (inBar === 3) {
        [0.5, 0.67, 0.83].forEach(d => noise(out, {at: t + BEAT * d, duration: 0.06, volume: 0.1, filter: "bandpass", frequency: 2100, q: 0.9}));
    }
    // a quiet tick on every off-beat keeps it moving
    noise(out, {at: t + BEAT / 2, duration: 0.03, volume: 0.04, filter: "highpass", frequency: 7000});

    // the bugle: every other phrase, over its last four bars
    if (phrase % 2 === 1 && bar >= 4) {
        const local = (bar - 4) * 4 + inBar;
        TUNE.filter(([at]) => at >= local && at < local + 1).forEach(([at, n, length]) =>
            tone(out, {at: t + (at - local) * BEAT, frequency: NOTE(n), duration: BEAT * length * 0.95, type: "sawtooth", volume: 0.07, attack: 0.03}));
    }
}

function tick() {
    const context = audioContext();
    if (!context) return;
    // plan everything that starts within the next 0.3 seconds
    while (nextBeatTime < context.currentTime + 0.3) {
        scheduleBeat(nextBeatTime, beat);
        nextBeatTime += BEAT;
        beat++;
    }
}

function update() {
    const context = audioContext();
    const playing = !!timer;
    const wanted = !!context && soundSettings().music;
    if (wanted && !playing) {
        nextBeatTime = context.currentTime + 0.1;
        beat = 0;
        timer = setInterval(tick, 100);
    } else if (!wanted && playing) {
        clearInterval(timer);
        timer = null;
    }
}

// Starts with the audio (after the first click or key) and follows the music setting.
export function installMusic() {
    onSoundChange(update);
    update();
}

// "calm" or "march"; takes effect from the next beat
export function setMood(next) {
    mood = next;
}
