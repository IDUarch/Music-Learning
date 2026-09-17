import React, { useState, useEffect, useCallback } from 'react';
import { 
  Eye, 
  Play, 
  RotateCcw, 
  Award, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Music, 
  Volume2,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { InstrumentTimbre } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface SightReadingTrainerProps {
  currentTimbre: InstrumentTimbre;
  onUpdateScore: (points: number) => void;
}

interface StaffNote {
  name: string; // e.g. "C4", "E4", "G4"
  farsi: string; // e.g. "دو", "می", "سل"
  solfege: string; // "Do", "Mi", "Sol"
  clef: 'treble' | 'bass';
  positionY: number; // Y offset on staff
  hasLedgerLine?: boolean;
  ledgerLineY?: number;
}

const TREBLE_NOTES: StaffNote[] = [
  { name: 'C4', farsi: 'دو ۴', solfege: 'Do', clef: 'treble', positionY: 100, hasLedgerLine: true, ledgerLineY: 100 },
  { name: 'D4', farsi: 'ر ۴', solfege: 'Re', clef: 'treble', positionY: 90 },
  { name: 'E4', farsi: 'می ۴ (خط اول)', solfege: 'Mi', clef: 'treble', positionY: 80 },
  { name: 'F4', farsi: 'فا ۴ (بین خط ۱ و ۲)', solfege: 'Fa', clef: 'treble', positionY: 70 },
  { name: 'G4', farsi: 'سل ۴ (خط دوم)', solfege: 'Sol', clef: 'treble', positionY: 60 },
  { name: 'A4', farsi: 'لا ۴ (بین خط ۲ و ۳)', solfege: 'La', clef: 'treble', positionY: 50 },
  { name: 'B4', farsi: 'سی ۴ (خط سوم)', solfege: 'Si', clef: 'treble', positionY: 40 },
  { name: 'C5', farsi: 'دو ۵ (بین خط ۳ و ۴)', solfege: 'Do', clef: 'treble', positionY: 30 },
  { name: 'D5', farsi: 'ر ۵ (خط چهارم)', solfege: 'Re', clef: 'treble', positionY: 20 },
  { name: 'E5', farsi: 'می ۵ (بین خط ۴ و ۵)', solfege: 'Mi', clef: 'treble', positionY: 10 },
  { name: 'F5', farsi: 'فا ۵ (خط پنجم)', solfege: 'Fa', clef: 'treble', positionY: 0 },
  { name: 'G5', farsi: 'سل ۵ (بالای خط پنجم)', solfege: 'Sol', clef: 'treble', positionY: -10 },
  { name: 'A5', farsi: 'لا ۵ (خط اضافه بالا)', solfege: 'La', clef: 'treble', positionY: -20, hasLedgerLine: true, ledgerLineY: -20 },
];

const BASS_NOTES: StaffNote[] = [
  { name: 'E2', farsi: 'می ۲', solfege: 'Mi', clef: 'bass', positionY: 100, hasLedgerLine: true, ledgerLineY: 100 },
  { name: 'G2', farsi: 'سل ۲ (خط اول فا)', solfege: 'Sol', clef: 'bass', positionY: 80 },
  { name: 'B2', farsi: 'سی ۲ (خط دوم)', solfege: 'Si', clef: 'bass', positionY: 60 },
  { name: 'D3', farsi: 'ر ۳ (خط سوم)', solfege: 'Re', clef: 'bass', positionY: 40 },
  { name: 'F3', farsi: 'فا ۳ (خط چهارم فا)', solfege: 'Fa', clef: 'bass', positionY: 20 },
  { name: 'A3', farsi: 'لا ۳ (خط پنجم)', solfege: 'La', clef: 'bass', positionY: 0 },
  { name: 'C4', farsi: 'دو ۴ (دو میانی روی خط بالا)', solfege: 'Do', clef: 'bass', positionY: -20, hasLedgerLine: true, ledgerLineY: -20 },
];

export const SightReadingTrainer: React.FC<SightReadingTrainerProps> = ({ currentTimbre, onUpdateScore }) => {
  const [selectedClef, setSelectedClef] = useState<'treble' | 'bass' | 'both'>('treble');
  const [currentNote, setCurrentNote] = useState<StaffNote>(TREBLE_NOTES[0]);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [lastFeedback, setLastFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [namingFormat, setNamingFormat] = useState<'solfege' | 'latin'>('solfege');
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [showMnemonicGuide, setShowMnemonicGuide] = useState<boolean>(true);

  const handleFocusMnemonicNote = (noteName: string, clef: 'treble' | 'bass') => {
    setSelectedClef(clef);
    const pool = clef === 'treble' ? TREBLE_NOTES : BASS_NOTES;
    const target = pool.find((n) => n.name === noteName) || pool[0];
    setCurrentNote(target);
    setLastFeedback(null);
    audioEngine.playNote(target.name, currentTimbre, 1.0);
  };

  const getPool = useCallback(() => {
    if (selectedClef === 'treble') return TREBLE_NOTES;
    if (selectedClef === 'bass') return BASS_NOTES;
    return [...TREBLE_NOTES, ...BASS_NOTES];
  }, [selectedClef]);

  const generateNextNote = useCallback(() => {
    const pool = getPool();
    let next: StaffNote;
    do {
      next = pool[Math.floor(Math.random() * pool.length)];
    } while (pool.length > 1 && next.name === currentNote?.name && next.clef === currentNote?.clef);

    setCurrentNote(next);
    setLastFeedback(null);

    if (autoPlayAudio) {
      setTimeout(() => {
        audioEngine.playNote(next.name, currentTimbre, 0.8);
      }, 100);
    }
  }, [getPool, currentNote, autoPlayAudio, currentTimbre]);

  useEffect(() => {
    generateNextNote();
  }, [selectedClef]);

  const handleGuess = (guessedLetter: string) => {
    // extract base letter e.g. "C" from "C4"
    const correctLetter = currentNote.name.replace(/\d+/, '');
    const isCorrect = guessedLetter === correctLetter;

    // play note
    audioEngine.playNote(currentNote.name, currentTimbre, 1.0);

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      onUpdateScore(10 + newStreak * 2);

      if (newStreak % 5 === 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      setLastFeedback({
        isCorrect: true,
        message: `آفرین! نت ${currentNote.farsi} (${currentNote.name}) صحیح بود.`,
      });

      setTimeout(() => {
        generateNextNote();
      }, 800);
    } else {
      setStreak(0);
      setLastFeedback({
        isCorrect: false,
        message: `پاسخ صحیح نت ${currentNote.farsi} (${currentNote.name}) بود. دوباره دقت کن!`,
      });
    }
  };

  const noteButtons = [
    { letter: 'C', farsi: 'دو (Do)', color: 'border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-[#F0F0F2]' },
    { letter: 'D', farsi: 'ر (Re)', color: 'border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-[#F0F0F2]' },
    { letter: 'E', farsi: 'می (Mi)', color: 'border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-[#F0F0F2]' },
    { letter: 'F', farsi: 'فا (Fa)', color: 'border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-[#F0F0F2]' },
    { letter: 'G', farsi: 'سل (Sol)', color: 'border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-[#F0F0F2]' },
    { letter: 'A', farsi: 'لا (La)', color: 'border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-[#F0F0F2]' },
    { letter: 'B', farsi: 'سی (Si)', color: 'border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-[#F0F0F2]' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Settings */}
      <div className="bg-[#131317] border border-white/10 rounded-[28px] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#F0F0F2] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Eye className="w-4 h-4" />
              </div>
              <span>مربی هوشمند نت‌خوانی روی خطوط حامل (Sight Reading)</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/50 mt-1">
              موقعیت نت روی پنج خط حامل را تشخیص دهید و سرعت دیداری و سلفژ خود را تقویت کنید.
            </p>
          </div>

          {/* Clef & Options Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white/5 px-2.5 py-1 rounded-full border border-white/10 text-xs">
              <span className="text-white/40 ml-2">کلید موسیقی:</span>
              <button
                onClick={() => setSelectedClef('treble')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  selectedClef === 'treble' ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-500/30' : 'text-white/60 hover:text-white'
                }`}
              >
                کلید سل (Treble)
              </button>
              <button
                onClick={() => setSelectedClef('bass')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  selectedClef === 'bass' ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-500/30' : 'text-white/60 hover:text-white'
                }`}
              >
                کلید فا (Bass)
              </button>
              <button
                onClick={() => setSelectedClef('both')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  selectedClef === 'both' ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-500/30' : 'text-white/60 hover:text-white'
                }`}
              >
                ترکیبی
              </button>
            </div>

            <button
              onClick={() => setAutoPlayAudio(!autoPlayAudio)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                autoPlayAudio ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>پخش خودکار صدا: {autoPlayAudio ? 'فعال' : 'غیرفعال'}</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-4 text-xs sm:text-sm relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/20">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>زنجیره پاسخ‌های درست: {streak}</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-300 bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/20 font-medium">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>بهترین رکورد: {bestStreak}</span>
            </div>
          </div>

          <button
            onClick={generateNextNote}
            className="flex items-center gap-1 text-white/50 hover:text-white text-xs px-3 py-1 bg-white/5 rounded-full border border-white/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>نت بعدی</span>
          </button>
        </div>
      </div>

      {/* Musical Staff Display Area */}
      <div className="bg-[#0A0A0C] border border-white/10 rounded-[28px] p-6 shadow-2xl flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
        <div className="absolute inset-0 bg-artistic-grid opacity-25 pointer-events-none"></div>

        {/* Clef Indicator Badge */}
        <div className="absolute top-4 right-4 bg-white/5 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 text-xs text-white/70 flex items-center gap-1.5 z-10">
          <Music className="w-3.5 h-3.5 text-indigo-400" />
          <span>{currentNote.clef === 'treble' ? 'کلید سل (Treble Clef)' : 'کلید فا (Bass Clef)'}</span>
        </div>

        {/* Listen Button */}
        <button
          onClick={() => audioEngine.playNote(currentNote.name, currentTimbre, 1.2)}
          className="absolute top-4 left-4 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-3.5 py-1 rounded-full text-xs flex items-center gap-1.5 transition-colors z-10 font-medium"
          title="شنیدن صدای این نت"
        >
          <Play className="w-3.5 h-3.5 fill-indigo-300" />
          <span>شنیدن نت</span>
        </button>

        {/* SVG Staff Notation Canvas */}
        <div className="w-full max-w-md py-6 flex justify-center relative z-10">
          <svg
            viewBox="0 0 360 160"
            className="w-full max-w-sm h-48 drop-shadow-2xl"
          >
            {/* 5 Staff Lines */}
            <line x1="20" y1="40" x2="340" y2="40" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <line x1="20" y1="60" x2="340" y2="60" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <line x1="20" y1="80" x2="340" y2="80" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <line x1="20" y1="100" x2="340" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <line x1="20" y1="120" x2="340" y2="120" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

            {/* Clef Symbol */}
            {currentNote.clef === 'treble' ? (
              <text x="35" y="118" fontSize="72" fill="#818CF8" fontFamily="serif" opacity="0.95">
                𝄞
              </text>
            ) : (
              <text x="35" y="95" fontSize="60" fill="#818CF8" fontFamily="serif" opacity="0.95">
                𝄢
              </text>
            )}

            {/* Optional Ledger Line */}
            {currentNote.hasLedgerLine && (
              <line
                x1="180"
                y1={currentNote.ledgerLineY! + 40}
                x2="240"
                y2={currentNote.ledgerLineY! + 40}
                stroke="#6366F1"
                strokeWidth="2.5"
                strokeDasharray="1 0"
              />
            )}

            {/* The Note Head */}
            <g transform={`translate(210, ${currentNote.positionY + 40})`}>
              {/* Glow filter */}
              <ellipse
                cx="0"
                cy="0"
                rx="14"
                ry="10"
                transform="rotate(-20)"
                fill="#6366F1"
                className="animate-pulse"
              />
              <ellipse
                cx="0"
                cy="0"
                rx="12"
                ry="8.5"
                transform="rotate(-20)"
                fill="#0F0F12"
              />
              <ellipse
                cx="0"
                cy="0"
                rx="8"
                ry="5"
                transform="rotate(-20)"
                fill="#818CF8"
              />

              {/* Note Stem */}
              {currentNote.positionY > 40 ? (
                <line x1="10" y1="0" x2="10" y2="-55" stroke="#818CF8" strokeWidth="3" />
              ) : (
                <line x1="-10" y1="0" x2="-10" y2="55" stroke="#818CF8" strokeWidth="3" />
              )}
            </g>
          </svg>
        </div>

        {/* Feedback Banner */}
        {lastFeedback && (
          <div
            className={`mt-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 border animate-in zoom-in-95 duration-150 relative z-10 ${
              lastFeedback.isCorrect
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}
          >
            {lastFeedback.isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
            <span>{lastFeedback.message}</span>
          </div>
        )}
      </div>

      {/* Interactive Guess Buttons */}
      <div className="bg-[#131317] border border-white/10 rounded-[28px] p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="text-center text-xs sm:text-sm font-semibold text-white/70">
          نام نت نمایش داده شده چیست؟ روی نت صحیح کلیک کنید:
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {noteButtons.map((btn) => (
            <button
              key={btn.letter}
              id={`guess-note-${btn.letter}`}
              onClick={() => handleGuess(btn.letter)}
              className={`p-4 rounded-2xl border bg-white/5 font-bold transition-all duration-150 transform active:scale-95 flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-indigo-500/10 ${btn.color}`}
            >
              <span className="font-latin text-xl sm:text-2xl font-black">{btn.letter}</span>
              <span className="text-xs font-medium text-white/50">{btn.farsi}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Teacher's Golden Mnemonics & Visual Memory Tricks */}
      <div className="bg-[#131317] border border-indigo-500/30 rounded-[28px] p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5">
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shadow-md">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#F0F0F2] flex items-center gap-2">
                <span>ترفندهای طلایی استاد برای حفظ نام نت‌ها (روش‌های تصویری و آسان)</span>
                <span className="text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                  روش تضمینی حافظه بصری
                </span>
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                بدون نیاز به شمارش خسته‌کننده، با این ترفندهای شهودی و نشانه‌های دیداری هر نتی را در ۱ ثانیه بخوانید.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowMnemonicGuide(!showMnemonicGuide)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors text-xs flex items-center gap-1 border border-white/10"
          >
            <span>{showMnemonicGuide ? 'بستن راهنما' : 'مشاهده ترفندها'}</span>
            {showMnemonicGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showMnemonicGuide && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1 relative z-10 animate-in fade-in duration-200">
            {/* Trick 1: Line 2 = Sol */}
            <div className="bg-[#0F0F12] border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-3 relative overflow-hidden group hover:border-indigo-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>راز خط دوم: نت «سل» (Sol / G)</span>
                </span>
                <span className="font-latin font-bold text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                  Line 2 = G4
                </span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                <strong className="text-indigo-200">چرا خط دوم سل است؟</strong> اگر به انتهای پیچ درونی و حلقه حلزونی کلید سل (𝄞) نگاه کنید، دقیقاً دور <strong className="text-indigo-300">خط دوم</strong> حلقه می‌زند و تمام می‌شود! به همین دلیل به این کلید «کلید سل» می‌گویند و هر نتی روی خط دوم بنشیند، بی‌درنگ نت <strong className="text-white">سل</strong> است.
              </p>
              <button
                onClick={() => handleFocusMnemonicNote('G4', 'treble')}
                className="w-full mt-2 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-indigo-300" />
                <span>دیدن و شنیدن نت سل روی خط دوم</span>
              </button>
            </div>

            {/* Trick 2: Line 3 = Si */}
            <div className="bg-[#0F0F12] border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-3 relative overflow-hidden group hover:border-indigo-400 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>راز خط سوم: نت «سی» (Si / B)</span>
                </span>
                <span className="font-latin font-bold text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                  Line 3 = B4
                </span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                <strong className="text-indigo-200">چرا خط سوم سی است؟</strong> خط ۳ دقیقاً <strong className="text-indigo-300">خط وسط (شاه‌تیر حامل)</strong> است. هم‌آوایی عدد <strong className="text-white">«۳» (سه)</strong> با نام نت <strong className="text-white">«سی»</strong> ساده‌ترین ترفند دنیاست: <strong className="text-indigo-300">خط سه = نت سی!</strong> با دیدن خط وسط بلافاصله نت سی را تشخیص دهید.
              </p>
              <button
                onClick={() => handleFocusMnemonicNote('B4', 'treble')}
                className="w-full mt-2 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-indigo-300" />
                <span>دیدن و شنیدن نت سی روی خط سوم</span>
              </button>
            </div>

            {/* Trick 3: 5 Lines Formula */}
            <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>فرمول ۵ خط حامل (از ۱ تا ۵)</span>
                </span>
                <span className="text-xs text-white/40 font-mono">E G B D F</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                نت‌های روی ۵ خط را با این سرود ساده مانند شماره تلفن حفظ کنید:
              </p>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-center font-bold text-xs text-indigo-200">
                « می - سل - سی - ر - فا »
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">
                خط ۱: می | خط ۲: سل (پیچ کلید) | خط ۳: سی (وسط) | خط ۴: ر | خط ۵: فا
              </p>
            </div>

            {/* Trick 4: 4 Spaces Formula */}
            <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>فرمول ۴ فاصله بین خطوط (از ۱ تا ۴)</span>
                </span>
                <span className="text-xs text-white/40 font-mono">F A C E</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                نت‌هایی که میان خطوط پنج‌گانه می‌نشینند کلمه انگلیسی <strong className="text-indigo-300">FACE (صورت)</strong> را می‌سازند:
              </p>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-center font-bold text-xs text-indigo-200">
                « فا - لا - دو - می » (F - A - C - E)
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">
                فاصله ۱: فا | فاصله ۲: لا | فاصله ۳: دو | فاصله ۴: می
              </p>
            </div>

            {/* Trick 5: Bass Clef Line 4 = Fa */}
            <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>راز کلید فا: خط ۴ = نت فا (Fa / F)</span>
                </span>
                <span className="font-latin font-bold text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                  Bass Line 4 = F3
                </span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                در کلید فا (𝄢)، <strong className="text-indigo-200">دو نقطه کلید</strong> بالا و پایین <strong className="text-indigo-300">خط چهارم</strong> قرار دارند؛ بنابراین خط چهارم همیشه نت <strong className="text-white">فا (F)</strong> است!
              </p>
              <button
                onClick={() => handleFocusMnemonicNote('F3', 'bass')}
                className="w-full mt-2 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-indigo-300" />
                <span>دیدن و شنیدن نت فا در کلید فا</span>
              </button>
            </div>

            {/* Trick 6: Middle C */}
            <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-indigo-400" />
                  <span>دو میانی (Middle C - C4)</span>
                </span>
                <span className="text-xs text-white/40 font-mono">C4 (دو)</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                نت دو میانی (C4) سیاره‌ای است با کمربندی بر تن! روی یک خط اضافه (خط حامل کمکی) پایین خط اول در کلید سل می‌نشیند.
              </p>
              <button
                onClick={() => handleFocusMnemonicNote('C4', 'treble')}
                className="w-full mt-2 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-indigo-300" />
                <span>دیدن و شنیدن دو میانی (C4)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
