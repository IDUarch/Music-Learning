import React, { useState } from 'react';
import { 
  Guitar, 
  Play, 
  Layers, 
  Sparkles, 
  Volume2, 
  HelpCircle, 
  RotateCcw 
} from 'lucide-react';
import { InstrumentTimbre } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { WESTERN_SCALES } from '../data/chords';

interface FretboardVisualizerProps {
  currentTimbre: InstrumentTimbre;
  onAskMaestro?: (prompt: string) => void;
}

interface StringConfig {
  name: string;
  farsi: string;
  openNote: string;
  openMidi: number;
}

const GUITAR_STRINGS: StringConfig[] = [
  { name: '1 (High E)', farsi: 'سیم ۱ (می زیر)', openNote: 'E4', openMidi: 64 },
  { name: '2 (B)', farsi: 'سیم ۲ (سی)', openNote: 'B3', openMidi: 59 },
  { name: '3 (G)', farsi: 'سیم ۳ (سل)', openNote: 'G3', openMidi: 55 },
  { name: '4 (D)', farsi: 'سیم ۴ (ر)', openNote: 'D3', openMidi: 50 },
  { name: '5 (A)', farsi: 'سیم ۵ (لا)', openNote: 'A2', openMidi: 45 },
  { name: '6 (Low E)', farsi: 'سیم ۶ (می بم)', openNote: 'E2', openMidi: 40 },
];

const SETAR_STRINGS: StringConfig[] = [
  { name: 'سیم اول (سفید / Do)', farsi: 'دو (C4)', openNote: 'C4', openMidi: 60 },
  { name: 'سیم دوم (زرد / Sol)', farsi: 'سل (G3)', openNote: 'G3', openMidi: 55 },
  { name: 'سیم سوم (مشتاق / Do)', farsi: 'دو (C4)', openNote: 'C4', openMidi: 60 },
  { name: 'سیم چهارم (بم / Do)', farsi: 'دو بم (C3)', openNote: 'C3', openMidi: 48 },
];

const MIDI_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FARSI_NOTE_NAMES: Record<string, string> = {
  'C': 'دو', 'C#': 'دو♯',
  'D': 'ر', 'D#': 'ر♯',
  'E': 'می',
  'F': 'فا', 'F#': 'فا♯',
  'G': 'سل', 'G#': 'سل♯',
  'A': 'لا', 'A#': 'لا♯',
  'B': 'سی',
};

export const FretboardVisualizer: React.FC<FretboardVisualizerProps> = ({ currentTimbre, onAskMaestro }) => {
  const [instrument, setInstrument] = useState<'guitar' | 'setar'>('guitar');
  const [highlightScale, setHighlightScale] = useState<string>('none');
  const [scaleRoot, setScaleRoot] = useState<string>('C');
  const [activeFretNote, setActiveFretNote] = useState<string | null>(null);

  const strings = instrument === 'guitar' ? GUITAR_STRINGS : SETAR_STRINGS;
  const numFrets = 12; // 0 to 12

  // Get note info for string and fret
  const getNoteAtFret = (openMidi: number, fret: number) => {
    const midi = openMidi + fret;
    const semitone = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    const letter = MIDI_NOTE_NAMES[semitone];
    const farsi = FARSI_NOTE_NAMES[letter] || letter;
    const fullName = `${letter}${octave}`;
    return { fullName, letter, farsi, midi };
  };

  // Determine if note is in selected scale
  const isNoteInScale = (noteLetter: string) => {
    if (highlightScale === 'none') return false;
    const scale = WESTERN_SCALES.find((s) => s.id === highlightScale);
    if (!scale) return false;

    const rootIdx = MIDI_NOTE_NAMES.indexOf(scaleRoot);
    const validLetters = scale.intervals.map((semi) => MIDI_NOTE_NAMES[(rootIdx + semi) % 12]);
    return validLetters.includes(noteLetter);
  };

  const handlePlayFret = (noteName: string) => {
    setActiveFretNote(noteName);
    const timbreToUse = instrument === 'guitar' ? 'guitar' : 'harp';
    audioEngine.playNote(noteName, timbreToUse, 1.2);
    setTimeout(() => setActiveFretNote(null), 600);
  };

  return (
    <div className="space-y-6">
      {/* Header & Settings */}
      <div className="bg-[#131317] border border-white/10 rounded-[28px] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#F0F0F2] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Guitar className="w-4 h-4" />
              </div>
              <span>فرت‌بورد تعاملی سازهای زهی (گیتار و سه‌تار / تار)</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/50 mt-1">
              محل قرارگیری نت‌ها، باره‌ها و گام‌ها را روی دسته ساز به صورت تعاملی بیاموزید.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Instrument Switch */}
            <div className="flex items-center bg-white/5 p-1 rounded-full border border-white/10 text-xs">
              <button
                onClick={() => setInstrument('guitar')}
                className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                  instrument === 'guitar' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/25' : 'text-white/60 hover:text-white'
                }`}
              >
                گیتار ۶ سیم
              </button>
              <button
                onClick={() => setInstrument('setar')}
                className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                  instrument === 'setar' ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/25' : 'text-white/60 hover:text-white'
                }`}
              >
                سه‌تار / تار ایرانی
              </button>
            </div>
          </div>
        </div>

        {/* Scale Highlighter Toolbar */}
        <div className="pt-4 flex flex-wrap items-center gap-3 text-xs relative z-10">
          <span className="text-white/60 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>هایلایت گام روی دسته ساز:</span>
          </span>

          <select
            value={scaleRoot}
            onChange={(e) => setScaleRoot(e.target.value)}
            className="bg-[#0F0F12] border border-white/10 text-indigo-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            {MIDI_NOTE_NAMES.map((n) => (
              <option key={n} value={n}>{n} ({FARSI_NOTE_NAMES[n]})</option>
            ))}
          </select>

          <select
            value={highlightScale}
            onChange={(e) => setHighlightScale(e.target.value)}
            className="bg-[#0F0F12] border border-white/10 text-white/80 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 flex-1 max-w-xs"
          >
            <option value="none">-- بدون هایلایت --</option>
            {WESTERN_SCALES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Fretboard Graphic Display */}
      <div className="bg-[#131317] border border-white/10 rounded-[28px] p-5 sm:p-6 shadow-2xl overflow-x-auto relative">
        <div className="min-w-[700px] select-none">
          {/* Fret Numbers Header */}
          <div className="flex items-center text-xs text-white/40 font-latin font-bold mb-2 pr-28">
            {Array.from({ length: numFrets + 1 }).map((_, f) => (
              <div key={f} className={`text-center ${f === 0 ? 'w-14' : 'flex-1'}`}>
                {f === 0 ? 'Open (۰)' : f}
                {[3, 5, 7, 9].includes(f) && (
                  <span className="block text-[10px] text-indigo-400">●</span>
                )}
                {f === 12 && (
                  <span className="block text-[10px] text-indigo-400">●●</span>
                )}
              </div>
            ))}
          </div>

          {/* Strings and Frets Grid */}
          <div className="bg-[#0F0F12] rounded-2xl border border-white/10 p-3 relative shadow-inner space-y-3">
            {strings.map((str, sIdx) => (
              <div key={sIdx} className="flex items-center relative py-1">
                {/* String Label */}
                <div className="w-28 text-xs font-semibold text-white/80 shrink-0 text-right pr-2">
                  <span className="text-indigo-400">{str.farsi}</span>
                </div>

                {/* String Line (thicker for lower strings) */}
                <div
                  className="absolute left-28 right-0 bg-white/20 pointer-events-none z-0"
                  style={{ height: `${Math.max(1.5, 4 - sIdx * 0.5)}px` }}
                ></div>

                {/* Frets for this string */}
                <div className="flex-1 flex items-center relative z-10">
                  {Array.from({ length: numFrets + 1 }).map((_, fret) => {
                    const noteInfo = getNoteAtFret(str.openMidi, fret);
                    const isInScale = isNoteInScale(noteInfo.letter);
                    const isActive = activeFretNote === noteInfo.fullName;

                    return (
                      <div
                        key={fret}
                        className={`flex justify-center items-center ${
                          fret === 0 ? 'w-14' : 'flex-1 border-r border-white/10 h-10'
                        }`}
                      >
                        <button
                          onClick={() => handlePlayFret(noteInfo.fullName)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex flex-col items-center justify-center text-[10px] font-bold transition-all transform active:scale-95 shadow-md ${
                            isActive
                              ? 'bg-indigo-400 text-white scale-110 shadow-indigo-400/50 ring-2 ring-white'
                              : isInScale
                              ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/60 hover:scale-105'
                              : fret === 0
                              ? 'bg-white/10 text-indigo-300 hover:bg-white/20 border border-white/10'
                              : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/15 border border-white/10'
                          }`}
                          title={`${noteInfo.farsi} (${noteInfo.fullName})`}
                        >
                          <span className="font-latin">{noteInfo.letter}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
