import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Volume2, 
  Layers, 
  Sparkles, 
  HelpCircle, 
  Music2, 
  Piano,
  Disc, 
  Square, 
  Repeat, 
  Sliders, 
  ArrowLeftRight 
} from 'lucide-react';
import { InstrumentTimbre } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { CHORD_DEFINITIONS, PIANO_KEYS_MAP, WESTERN_SCALES } from '../data/chords';

interface SmartPianoProps {
  currentTimbre: InstrumentTimbre;
  onAskMaestro?: (prompt: string) => void;
}

export const SmartPiano: React.FC<SmartPianoProps> = ({ currentTimbre, onAskMaestro }) => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [namingMode, setNamingMode] = useState<'both' | 'farsi' | 'latin'>('both');
  const [selectedChordRoot, setSelectedChordRoot] = useState<string>('C4');
  const [selectedChordType, setSelectedChordType] = useState<string>('Major');
  const [selectedScaleRoot, setSelectedScaleRoot] = useState<string>('C4');
  const [selectedScaleType, setSelectedScaleType] = useState<string>('none');
  const [sustainPedal, setSustainPedal] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedNotes, setRecordedNotes] = useState<{ note: string; time: number }[]>([]);
  const [isPlayingBack, setIsPlayingBack] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [octaveShift, setOctaveShift] = useState<number>(0); // -1, 0, +1

  const recordStartTimeRef = useRef<number>(0);

  // Keyboard mapping for computer typing
  const KEY_BINDINGS: Record<string, string> = {
    'a': 'C4', 'w': 'C#4',
    's': 'D4', 'e': 'D#4',
    'd': 'E4',
    'f': 'F4', 't': 'F#4',
    'g': 'G4', 'y': 'G#4',
    'h': 'A4', 'u': 'A#4',
    'j': 'B4',
    'k': 'C5', 'o': 'C#5',
    'l': 'D5', 'p': 'D#5',
    ';': 'E5',
    "'": 'F5',
  };

  // Calculate highlighted notes based on chord or scale
  const getHighlightedNotes = useCallback((): Set<string> => {
    const highlighted = new Set<string>();

    if (selectedScaleType !== 'none') {
      const scale = WESTERN_SCALES.find((s) => s.id === selectedScaleType);
      if (scale) {
        const rootKey = PIANO_KEYS_MAP.find((k) => k.name === selectedScaleRoot);
        if (rootKey) {
          scale.intervals.forEach((semitones) => {
            const targetMidi = rootKey.midi + semitones;
            const targetKey = PIANO_KEYS_MAP.find((k) => k.midi === targetMidi);
            if (targetKey) highlighted.add(targetKey.name);
          });
        }
      }
    } else if (selectedChordType) {
      const chord = CHORD_DEFINITIONS.find((c) => c.name === selectedChordType);
      if (chord) {
        const rootKey = PIANO_KEYS_MAP.find((k) => k.name === selectedChordRoot);
        if (rootKey) {
          chord.semitones.forEach((semitones) => {
            const targetMidi = rootKey.midi + semitones;
            const targetKey = PIANO_KEYS_MAP.find((k) => k.midi === targetMidi);
            if (targetKey) highlighted.add(targetKey.name);
          });
        }
      }
    }

    return highlighted;
  }, [selectedChordRoot, selectedChordType, selectedScaleRoot, selectedScaleType]);

  const highlightedNotes = getHighlightedNotes();

  const handleNoteOn = useCallback((noteName: string) => {
    setActiveKeys((prev) => new Set(prev).add(noteName));
    audioEngine.playNote(noteName, currentTimbre, sustainPedal ? 2.5 : 0);

    if (isRecording) {
      const time = Date.now() - recordStartTimeRef.current;
      setRecordedNotes((prev) => [...prev, { note: noteName, time }]);
    }
  }, [currentTimbre, sustainPedal, isRecording]);

  const handleNoteOff = useCallback((noteName: string) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      next.delete(noteName);
      return next;
    });
    if (!sustainPedal) {
      audioEngine.stopNote(`${noteName}-0`);
    }
  }, [sustainPedal]);

  // Physical computer keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const note = KEY_BINDINGS[e.key.toLowerCase()];
      if (note) {
        e.preventDefault();
        handleNoteOn(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = KEY_BINDINGS[e.key.toLowerCase()];
      if (note) {
        e.preventDefault();
        handleNoteOff(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleNoteOn, handleNoteOff]);

  // Play full selected chord
  const handlePlaySelectedChord = () => {
    const notes = Array.from(highlightedNotes) as string[];
    if (notes.length > 0) {
      audioEngine.playChord(notes, currentTimbre, 2.0);
    }
  };

  // Play scale arpeggio sequence
  const handlePlayScaleSequence = () => {
    const notes = (Array.from(highlightedNotes) as string[]).map((n) => ({ name: n }));
    if (notes.length > 0) {
      audioEngine.playSequence(notes, currentTimbre, 240);
    }
  };

  // Recording controls
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setRecordedNotes([]);
      recordStartTimeRef.current = Date.now();
      setIsRecording(true);
    }
  };

  const handlePlayback = async () => {
    if (recordedNotes.length === 0 || isPlayingBack) return;
    setIsPlayingBack(true);

    for (let i = 0; i < recordedNotes.length; i++) {
      const curr = recordedNotes[i];
      const next = recordedNotes[i + 1];
      
      handleNoteOn(curr.note);
      setTimeout(() => handleNoteOff(curr.note), 300);

      if (next) {
        const delay = Math.max(50, next.time - curr.time);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    setIsPlayingBack(false);
  };

  // Gemini AI Analysis of current chord/notes
  const handleAnalyzeWithAI = async () => {
    const notes = Array.from(highlightedNotes);
    if (notes.length === 0) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          chord: `${selectedChordRoot} ${selectedChordType}`,
          scale: selectedScaleType !== 'none' ? selectedScaleType : undefined,
          question: 'لطفاً رنگ صدایی، فواصل، نام آکورد و کاربرد آن در موسیقی ایرانی یا غربی را تحلیل کنید.',
        }),
      });
      const data = await response.json();
      setAiAnalysisResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter keys by visible octave range
  const visibleKeys = PIANO_KEYS_MAP.filter((k) => {
    const octave = parseInt(k.name.slice(-1), 10);
    if (octaveShift === -1) return octave >= 3 && octave <= 4;
    if (octaveShift === 1) return octave >= 4 && octave <= 5;
    return octave >= 3 && octave <= 5; // standard 3-octave view
  });

  return (
    <div className="space-y-6">
      {/* Controls & Mode Selectors */}
      <div className="bg-white border border-slate-200 rounded-[28px] p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200/80 relative z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                <Piano className="w-5 h-5" />
              </div>
              <span>پیانوی هوشمند و آکوردشناس تعاملی</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              با کلاویه‌ها بنوازید، آکوردها و گام‌ها را هایلایت کنید، ضبط کنید و از هوش مصنوعی تحلیل بخواهید.
            </p>
          </div>

          {/* Quick Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Note Name Display Mode */}
            <div className="flex items-center bg-slate-100 px-3 py-1 rounded-full border border-slate-200 text-xs shadow-2xs">
              <span className="text-slate-500 ml-2 font-medium">نام نت‌ها:</span>
              <button
                onClick={() => setNamingMode('farsi')}
                className={`px-2.5 py-0.5 rounded-full transition-colors font-medium ${namingMode === 'farsi' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                دو، ر، می
              </button>
              <button
                onClick={() => setNamingMode('latin')}
                className={`px-2.5 py-0.5 rounded-full transition-colors font-medium ${namingMode === 'latin' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                C, D, E
              </button>
              <button
                onClick={() => setNamingMode('both')}
                className={`px-2.5 py-0.5 rounded-full transition-colors font-medium ${namingMode === 'both' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                هردو
              </button>
            </div>

            {/* Sustain Pedal Toggle */}
            <button
              id="sustain-pedal-btn"
              onClick={() => setSustainPedal(!sustainPedal)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                sustainPedal 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>پدال سستین: {sustainPedal ? 'روشن' : 'خاموش'}</span>
            </button>

            {/* Recording Button */}
            <button
              id="piano-record-btn"
              onClick={toggleRecording}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isRecording 
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-md shadow-rose-500/20' 
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              {isRecording ? <Square className="w-3.5 h-3.5 fill-white text-white" /> : <Disc className="w-3.5 h-3.5 text-rose-500" />}
              <span>{isRecording ? 'توقف ضبط' : 'ضبط نوازندگی'}</span>
            </button>

            {/* Playback Button */}
            {recordedNotes.length > 0 && (
              <button
                id="piano-playback-btn"
                onClick={handlePlayback}
                disabled={isPlayingBack || isRecording}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-600 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>پخش ضبط ({recordedNotes.length} نت)</span>
              </button>
            )}
          </div>
        </div>

        {/* Chord & Scale Visualizer Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-5 relative z-10">
          {/* Chord Selector */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>نمایش و پخش آکورد:</span>
              </span>
              <button
                onClick={handlePlaySelectedChord}
                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-[11px] font-bold"
                title="شنیدن صدای آکورد"
              >
                <Play className="w-3 h-3 fill-indigo-600" />
                <span>شنیدن</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedChordRoot}
                onChange={(e) => {
                  setSelectedChordRoot(e.target.value);
                  setSelectedScaleType('none');
                }}
                className="bg-white border border-slate-200 text-indigo-700 font-bold text-xs rounded-xl px-2.5 py-2 flex-1 focus:outline-none focus:border-indigo-500 shadow-2xs"
              >
                {['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <select
                value={selectedChordType}
                onChange={(e) => {
                  setSelectedChordType(e.target.value);
                  setSelectedScaleType('none');
                }}
                className="bg-white border border-slate-200 text-slate-800 font-medium text-xs rounded-xl px-2.5 py-2 flex-1 focus:outline-none focus:border-indigo-500 shadow-2xs"
              >
                {CHORD_DEFINITIONS.map((c) => (
                  <option key={c.name} value={c.name}>{c.farsiName} ({c.symbol})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Scale Selector */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>گام‌های غربی:</span>
              </span>
              {selectedScaleType !== 'none' && (
                <button
                  onClick={handlePlayScaleSequence}
                  className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-[11px] font-bold"
                  title="شنیدن آرپژ گام"
                >
                  <Play className="w-3 h-3 fill-indigo-600" />
                  <span>آرپژ</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedScaleRoot}
                onChange={(e) => setSelectedScaleRoot(e.target.value)}
                className="bg-white border border-slate-200 text-indigo-700 font-bold text-xs rounded-xl px-2.5 py-2 w-20 focus:outline-none focus:border-indigo-500 shadow-2xs"
              >
                {['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <select
                value={selectedScaleType}
                onChange={(e) => setSelectedScaleType(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 font-medium text-xs rounded-xl px-2.5 py-2 flex-1 focus:outline-none focus:border-indigo-500 shadow-2xs"
              >
                <option value="none">-- انتخاب گام --</option>
                {WESTERN_SCALES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Octave Shift Control */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
              <span>محدوده اکتاو کلاویه‌ها:</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOctaveShift(-1)}
                className={`flex-1 py-1.5 text-xs rounded-xl border font-bold transition-colors ${
                  octaveShift === -1 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs' 
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                بم (C3-C4)
              </button>
              <button
                onClick={() => setOctaveShift(0)}
                className={`flex-1 py-1.5 text-xs rounded-xl border font-bold transition-colors ${
                  octaveShift === 0 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs' 
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                کامل (۳ اکتاو)
              </button>
              <button
                onClick={() => setOctaveShift(1)}
                className={`flex-1 py-1.5 text-xs rounded-xl border font-bold transition-colors ${
                  octaveShift === 1 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs' 
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                زیر (C4-C6)
              </button>
            </div>
          </div>

          {/* AI Analysis Action */}
          <div className="bg-gradient-to-br from-indigo-50 via-indigo-100/50 to-white p-3.5 rounded-2xl border border-indigo-200 flex flex-col justify-between shadow-2xs">
            <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>تحلیل هوشمند هارمونی:</span>
            </div>
            <button
              id="piano-ai-analyze-btn"
              onClick={handleAnalyzeWithAI}
              disabled={isAnalyzing || highlightedNotes.size === 0}
              className="w-full mt-2.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>در حال تحلیل...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تحلیل آکورد/گام</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Piano Keyboard Visualizer */}
      <div className="bg-white border border-slate-200 rounded-[28px] p-4 sm:p-6 shadow-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-artistic-grid opacity-20 pointer-events-none"></div>

        {/* Computer Keyboard Guide */}
        <div className="flex items-center justify-between pb-3 text-xs text-slate-500 border-b border-slate-200 mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium">کلیدهای کیبورد کامپیوتر: ردیف اول A-S-D-F-G-H-J-K و ردیف کلیدهای سیاه W-E-T-Y-U-O</span>
          </div>
          <div className="text-indigo-600 font-bold font-latin">
            Timbre: {currentTimbre === 'piano' ? 'Acoustic Piano' : currentTimbre}
          </div>
        </div>

        {/* The Piano Keys Container */}
        <div className="relative overflow-x-auto pb-4 pt-2 select-none flex justify-center z-10">
          <div className="relative inline-flex bg-slate-900 p-3 rounded-2xl border-4 border-slate-800 shadow-xl">
            {/* White Keys */}
            {visibleKeys
              .filter((k) => !k.isBlack)
              .map((key) => {
                const isPressed = activeKeys.has(key.name);
                const isHighlighted = highlightedNotes.has(key.name);
                return (
                  <div
                    key={key.name}
                    id={`piano-key-${key.name}`}
                    onMouseDown={() => handleNoteOn(key.name)}
                    onMouseUp={() => handleNoteOff(key.name)}
                    onMouseLeave={() => isPressed && handleNoteOff(key.name)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleNoteOn(key.name);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleNoteOff(key.name);
                    }}
                    className={`relative w-10 sm:w-12 md:w-14 h-48 sm:h-56 rounded-b-xl cursor-pointer transition-all duration-75 flex flex-col justify-end items-center pb-3 mx-[1.5px] border-b-4 ${
                      isPressed
                        ? 'bg-indigo-500 text-white translate-y-1 shadow-inner border-indigo-700'
                        : isHighlighted
                        ? 'bg-gradient-to-b from-amber-50 via-amber-100 to-amber-200 text-amber-950 ring-2 ring-amber-500 border-amber-300'
                        : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-800 hover:bg-slate-50 border-slate-300 shadow-md'
                    }`}
                  >
                    {/* Highlight Glow indicator */}
                    {isHighlighted && (
                      <div className="absolute top-2 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></div>
                    )}
                    
                    {/* Note Label */}
                    <div className="text-center font-bold pointer-events-none">
                      {(namingMode === 'both' || namingMode === 'latin') && (
                        <div className="font-latin text-xs font-black">{key.name}</div>
                      )}
                      {(namingMode === 'both' || namingMode === 'farsi') && (
                        <div className="text-[11px] text-slate-600 font-bold">{key.farsi}</div>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* Black Keys Positioned Absolutely */}
            {visibleKeys
              .filter((k) => !k.isBlack)
              .map((whiteKey, idx) => {
                const noteLetter = whiteKey.name[0];
                if (['E', 'B'].includes(noteLetter)) return null;

                const octave = whiteKey.name.slice(-1);
                const blackKeyName = `${noteLetter}#${octave}`;
                const blackKeyData = visibleKeys.find((k) => k.name === blackKeyName);
                if (!blackKeyData) return null;

                const isPressed = activeKeys.has(blackKeyName);
                const isHighlighted = highlightedNotes.has(blackKeyName);

                return (
                  <div
                    key={blackKeyName}
                    id={`piano-key-${blackKeyName}`}
                    onMouseDown={() => handleNoteOn(blackKeyName)}
                    onMouseUp={() => handleNoteOff(blackKeyName)}
                    onMouseLeave={() => isPressed && handleNoteOff(blackKeyName)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleNoteOn(blackKeyName);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleNoteOff(blackKeyName);
                    }}
                    style={{
                      left: `calc(${idx + 1} * (100% / ${visibleKeys.filter((k) => !k.isBlack).length}) - 16px)`,
                    }}
                    className={`absolute top-3 z-20 w-7 sm:w-8 md:w-9 h-30 sm:h-34 rounded-b-lg cursor-pointer transition-all duration-75 flex flex-col justify-end items-center pb-2 shadow-2xl border border-black/80 ${
                      isPressed
                        ? 'bg-indigo-600 text-white translate-y-0.5'
                        : isHighlighted
                        ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                        : 'bg-gradient-to-b from-slate-800 via-slate-900 to-black text-white/80 hover:from-slate-700'
                    }`}
                  >
                    {isHighlighted && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white mb-1 animate-pulse"></div>
                    )}
                    <div className="text-center pointer-events-none">
                      <div className="font-latin text-[10px] font-bold">{blackKeyName}</div>
                      {namingMode !== 'latin' && (
                        <div className="text-[9px] text-white/60">دیز</div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* AI Chord Analysis Modal/Box */}
      {aiAnalysisResult && (
        <div className="bg-white border border-indigo-200 rounded-[28px] p-6 shadow-sm space-y-4 animate-in fade-in duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-indigo-900">تحلیل تخصصی مربی هوشمند امیتیس</h3>
            </div>
            <button
              onClick={() => setAiAnalysisResult(null)}
              className="text-slate-500 hover:text-slate-800 text-xs px-3 py-1 bg-slate-100 border border-slate-200 rounded-full transition-colors font-medium"
            >
              بستن
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs relative z-10">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-slate-500 block mb-1 font-medium">نام و ساختار:</span>
              <span className="text-sm font-bold text-indigo-700">{aiAnalysisResult.name || `${selectedChordRoot} ${selectedChordType}`}</span>
              <p className="text-slate-700 mt-1 font-medium">{aiAnalysisResult.intervals}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-slate-500 block mb-1 font-medium">حس و رنگ صدایی:</span>
              <span className="text-sm font-bold text-indigo-900">{aiAnalysisResult.mood}</span>
              <p className="text-slate-600 mt-1 font-medium">دستگاه یا گام معادل: {aiAnalysisResult.traditionalMatch}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 sm:col-span-2 lg:col-span-1">
              <span className="text-slate-500 block mb-1 font-medium">توالی آکورد پیشنهادی:</span>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block mt-0.5">
                {aiAnalysisResult.sampleProgression || 'I - IV - V - I'}
              </span>
            </div>
          </div>

          {aiAnalysisResult.tips && aiAnalysisResult.tips.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 relative z-10">
              <span className="text-xs font-bold text-slate-800 block mb-2">نکات نوازندگی و آهنگسازی:</span>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 font-medium">
                {aiAnalysisResult.tips.map((tip: string, i: number) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {onAskMaestro && (
            <button
              onClick={() => onAskMaestro(`درباره آکورد ${selectedChordRoot} ${selectedChordType} و کاربردهای پیشرفته آن در آهنگسازی بیشتر توضیح بده.`)}
              className="text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-4 flex items-center gap-1.5 relative z-10 font-bold"
            >
              <span>گفتگوی بیشتر با استاد امیتیس درباره این آکورد...</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
