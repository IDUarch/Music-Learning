import { InstrumentTimbre } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private activeVoices: Map<string, { oscs: OscillatorNode[]; gain: GainNode }> = new Map();
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Convert note name like "C4", "F#4", "Bb3" or with microtones to frequency
  public noteToFrequency(noteName: string, centsOffset: number = 0): number {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1,
      'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4,
      'F': 5, 'F#': 6, 'Gb': 6,
      'G': 7, 'G#': 8, 'Ab': 8,
      'A': 9, 'A#': 10, 'Bb': 10,
      'B': 11,
    };

    const match = noteName.match(/^([A-G][b#]?)(-?\d+)$/);
    if (!match) return 440;

    const note = match[1];
    const octave = parseInt(match[2], 10);
    const semitone = noteMap[note] ?? 0;
    
    // A4 = MIDI 69 = 440Hz
    const midiNumber = (octave + 1) * 12 + semitone;
    const baseFreq = 440 * Math.pow(2, (midiNumber - 69) / 12);

    if (centsOffset !== 0) {
      // 100 cents = 1 semitone
      return baseFreq * Math.pow(2, centsOffset / 1200);
    }

    return baseFreq;
  }

  // Play a note with specific timbre and duration or continuous hold
  public playNote(
    noteName: string,
    timbre: InstrumentTimbre = 'piano',
    durationSeconds: number = 0,
    centsOffset: number = 0,
    velocity: number = 0.8
  ) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const freq = this.noteToFrequency(noteName, centsOffset);
    const voiceKey = `${noteName}-${centsOffset}`;

    // Stop existing voice if any
    this.stopNote(voiceKey);

    const now = this.ctx.currentTime;
    const voiceGain = this.ctx.createGain();
    const oscs: OscillatorNode[] = [];

    // Sound shaping per instrument timbre
    if (timbre === 'piano' || timbre === 'grand_piano') {
      // Fundamental + Rich harmonic overtones
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, now); // Octave overtone

      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq * 3, now); // 5th overtone

      // Gain mixing
      const g1 = this.ctx.createGain();
      const g2 = this.ctx.createGain();
      const g3 = this.ctx.createGain();

      g1.gain.setValueAtTime(0.7, now);
      g2.gain.setValueAtTime(0.25, now);
      g3.gain.setValueAtTime(0.08, now);

      osc1.connect(g1);
      osc2.connect(g2);
      osc3.connect(g3);

      g1.connect(voiceGain);
      g2.connect(voiceGain);
      g3.connect(voiceGain);

      oscs.push(osc1, osc2, osc3);

      // Piano ADSR
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.exponentialRampToValueAtTime(velocity, now + 0.008);
      voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.45, now + 0.3);
      if (durationSeconds > 0) {
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);
        setTimeout(() => this.stopNote(voiceKey), durationSeconds * 1000 + 50);
      } else {
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
      }

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

    } else if (timbre === 'guitar') {
      // Plucked string acoustic timbre
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq, now);

      // Lowpass filter for pluck warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.4);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(voiceGain);
      oscs.push(osc1, osc2);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.9, now + 0.005);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + (durationSeconds > 0 ? durationSeconds : 2.0));

      osc1.start(now);
      osc2.start(now);

    } else if (timbre === 'flute') {
      // Warm Sine / Ney / Flute with gentle vibrato
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Vibrato LFO
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.5, now); // 5.5 Hz vibrato
      lfoGain.gain.setValueAtTime(freq * 0.015, now);
      lfo.connect(osc.frequency);
      lfo.start(now);

      osc.connect(voiceGain);
      oscs.push(osc, lfo);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(velocity * 0.7, now + 0.08); // soft attack
      if (durationSeconds > 0) {
        voiceGain.gain.setValueAtTime(velocity * 0.7, now + durationSeconds - 0.08);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);
        setTimeout(() => this.stopNote(voiceKey), durationSeconds * 1000 + 50);
      }

      osc.start(now);

    } else if (timbre === 'harp') {
      // Harp / Santur bell-like pluck
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now);

      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.3, now);
      osc2.connect(g2);
      g2.connect(voiceGain);
      osc1.connect(voiceGain);
      oscs.push(osc1, osc2);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.exponentialRampToValueAtTime(velocity, now + 0.003);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + (durationSeconds > 0 ? durationSeconds : 2.5));

      osc1.start(now);
      osc2.start(now);

    } else {
      // Synth Lead
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, now);

      osc.connect(filter);
      filter.connect(voiceGain);
      oscs.push(osc);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.7, now + 0.01);
      if (durationSeconds > 0) {
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);
      }
      osc.start(now);
    }

    voiceGain.connect(this.masterGain);
    this.activeVoices.set(voiceKey, { oscs, gain: voiceGain });
  }

  // Release a held note
  public stopNote(noteKey: string) {
    const voice = this.activeVoices.get(noteKey);
    if (!voice || !this.ctx) return;

    const now = this.ctx.currentTime;
    try {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      setTimeout(() => {
        voice.oscs.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
        voice.gain.disconnect();
        this.activeVoices.delete(noteKey);
      }, 180);
    } catch {
      this.activeVoices.delete(noteKey);
    }
  }

  public stopAll() {
    this.activeVoices.forEach((_, key) => {
      this.stopNote(key);
    });
  }

  // Play a full chord simultaneously
  public playChord(notes: string[], timbre: InstrumentTimbre = 'piano', durationSeconds: number = 1.8) {
    notes.forEach((note, i) => {
      // slight strum delay of 15ms for natural feel
      setTimeout(() => {
        this.playNote(note, timbre, durationSeconds, 0, 0.75);
      }, i * 18);
    });
  }

  // Play an ascending arpeggio or scale sequence
  public async playSequence(
    notes: { name: string; centsOffset?: number; duration?: number }[],
    timbre: InstrumentTimbre = 'piano',
    stepIntervalMs: number = 320
  ) {
    for (let i = 0; i < notes.length; i++) {
      const item = notes[i];
      this.playNote(item.name, timbre, item.duration || 0.6, item.centsOffset || 0, 0.8);
      await new Promise((res) => setTimeout(res, stepIntervalMs));
    }
  }

  // Metronome tick sound
  public playMetronomeTick(isDownbeat: boolean = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isDownbeat ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 1400 : 880, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(isDownbeat ? 0.9 : 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public setVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime);
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const audioEngine = new AudioEngine();
