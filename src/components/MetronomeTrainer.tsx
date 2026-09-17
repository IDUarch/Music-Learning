import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Timer, 
  Play, 
  Square, 
  Volume2, 
  Plus, 
  Minus, 
  Activity, 
  Sparkles, 
  Award, 
  RotateCcw, 
  HandMetal 
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface MetronomeTrainerProps {
  onUpdateScore?: (points: number) => void;
}

const TEMPO_MARKINGS = [
  { name: 'Largo (بسیار آرام و کشیده)', min: 40, max: 60 },
  { name: 'Adagio (آرام و باوقار)', min: 61, max: 76 },
  { name: 'Andante (با سرعت گام‌زدن معمولی)', min: 77, max: 108 },
  { name: 'Moderato (سرعت معتدل)', min: 109, max: 120 },
  { name: 'Allegro (تند و شاداب)', min: 121, max: 156 },
  { name: 'Presto (بسیار تند و سریع)', min: 157, max: 200 },
  { name: 'Prestissimo (نهایت سرعت)', min: 201, max: 260 },
];

export const MetronomeTrainer: React.FC<MetronomeTrainerProps> = ({ onUpdateScore }) => {
  const [bpm, setBpm] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState<number>(4);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // Rhythm Accuracy Game State
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [userTaps, setUserTaps] = useState<{ offsetMs: number; rating: string }[]>([]);
  const [accuracyScore, setAccuracyScore] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const nextBeatTimeRef = useRef<number>(0);
  const beatIndexRef = useRef<number>(0);

  const getTempoName = (val: number) => {
    const found = TEMPO_MARKINGS.find((m) => val >= m.min && val <= m.max);
    return found ? found.name : 'Custom';
  };

  // Precise Web Audio clock loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      setCurrentBeat(0);
      beatIndexRef.current = 0;
      return;
    }

    const intervalMs = (60 / bpm) * 1000;
    nextBeatTimeRef.current = Date.now();

    const tick = () => {
      const isDownbeat = beatIndexRef.current === 0;
      audioEngine.playMetronomeTick(isDownbeat);
      setCurrentBeat(beatIndexRef.current);
      beatIndexRef.current = (beatIndexRef.current + 1) % beatsPerMeasure;
      nextBeatTimeRef.current += intervalMs;
    };

    tick(); // immediate first beat
    timerRef.current = window.setInterval(tick, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm, beatsPerMeasure]);

  // Tap tempo detection
  const handleTapTempo = () => {
    const now = Date.now();
    const recent = tapTimes.filter((t) => now - t < 3000);
    const updated = [...recent, now];
    setTapTimes(updated);

    if (updated.length >= 2) {
      const intervals = [];
      for (let i = 1; i < updated.length; i++) {
        intervals.push(updated[i] - updated[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 260) {
        setBpm(calculatedBpm);
      }
    }
  };

  // Rhythm Accuracy Game: user taps in sync with beat
  const handleGameTap = () => {
    if (!isPlaying) return;
    const now = Date.now();
    const intervalMs = (60 / bpm) * 1000;
    
    // distance to nearest beat
    const timeSinceLast = (now - nextBeatTimeRef.current) % intervalMs;
    let offset = timeSinceLast > intervalMs / 2 ? timeSinceLast - intervalMs : timeSinceLast;
    const absOffset = Math.abs(offset);

    let rating = 'عالی (Perfect!)';
    let pts = 20;

    if (absOffset < 35) {
      rating = 'بی‌نقص (Perfect!)';
      pts = 25;
    } else if (absOffset < 75) {
      rating = offset < 0 ? 'کمی زودتر (Slightly Early)' : 'کمی دیرتر (Slightly Late)';
      pts = 15;
    } else if (absOffset < 140) {
      rating = offset < 0 ? 'خیلی زود (Too Early)' : 'خیلی دیر (Too Late)';
      pts = 5;
    } else {
      rating = 'خارج از ریتم (Off Beat)';
      pts = 0;
    }

    setUserTaps((prev) => [{ offsetMs: Math.round(offset), rating }, ...prev.slice(0, 7)]);
    setAccuracyScore((prev) => prev + pts);
    if (onUpdateScore && pts > 0) onUpdateScore(pts);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#131317] border border-white/10 rounded-[28px] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#F0F0F2] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Timer className="w-4 h-4" />
              </div>
              <span>مترونوم هوشمند و تمرین ریتم‌خوانی</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/50 mt-1">
              با دقت ریتمیک ساعت صوتی تمرین کنید، تمپو را با ضربه زدن (Tap) بسنجید و دقت ضرب‌آهنگ خود را آزمایش کنید.
            </p>
          </div>

          <div className="text-xs bg-white/5 px-4 py-1.5 rounded-full border border-white/10 text-indigo-300 font-medium">
            {getTempoName(bpm)}
          </div>
        </div>
      </div>

      {/* Main Metronome Unit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Core Controls */}
        <div className="lg:col-span-7 bg-[#131317] border border-white/10 rounded-[28px] p-6 shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-artistic-grid opacity-20 pointer-events-none"></div>

          {/* BPM Display */}
          <div className="text-center space-y-2 relative z-10">
            <div className="text-xs font-semibold text-white/40">سرعت ضرب‌آهنگ (BPM - ضربه در دقیقه)</div>
            <div className="font-latin text-6xl sm:text-7xl font-black text-[#F0F0F2] tracking-tight drop-shadow-lg">
              {bpm}
            </div>
            <div className="text-xs text-indigo-400 font-medium">{getTempoName(bpm)}</div>
          </div>

          {/* Beat LEDs Indicator */}
          <div className="flex items-center justify-center gap-3 py-2 relative z-10">
            {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
              const isCurrent = isPlaying && currentBeat === idx;
              const isDownbeat = idx === 0;

              return (
                <div
                  key={idx}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-latin font-bold text-xs sm:text-sm transition-all duration-75 border ${
                    isCurrent
                      ? isDownbeat
                        ? 'bg-rose-500 text-white border-rose-300 scale-110 shadow-lg shadow-rose-500/50 ring-4 ring-rose-500/30'
                        : 'bg-indigo-600 text-white border-indigo-300 scale-105 shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-400/30'
                      : 'bg-[#0A0A0C] border-white/10 text-white/30'
                  }`}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>

          {/* Slider & Increment/Decrement */}
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setBpm((b) => Math.max(40, b - 5))}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold text-xs flex items-center gap-1 transition-colors"
                title="-۵ BPM"
              >
                <Minus className="w-4 h-4" />
                <span>۵-</span>
              </button>

              <button
                onClick={() => setBpm((b) => Math.max(40, b - 1))}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold text-xs transition-colors"
                title="-۱ BPM"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="flex-1 accent-indigo-500 h-2 bg-white/10 rounded-lg cursor-pointer"
              />

              <button
                onClick={() => setBpm((b) => Math.min(240, b + 1))}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold text-xs transition-colors"
                title="+۱ BPM"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                onClick={() => setBpm((b) => Math.min(240, b + 5))}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-bold text-xs flex items-center gap-1 transition-colors"
                title="+۵ BPM"
              >
                <span>۵+</span>
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Time Signature Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-xs text-white/40 ml-1">کسر میزان:</span>
              {[
                { label: '۲/۴ (مارش)', beats: 2 },
                { label: '۳/۴ (والس)', beats: 3 },
                { label: '۴/۴ (معمولی)', beats: 4 },
                { label: '۶/۸ (ایرانی)', beats: 6 },
                { label: '۵/۸ (لنگ)', beats: 5 },
                { label: '۷/۸ (لنگ)', beats: 7 },
              ].map((ts) => (
                <button
                  key={ts.beats}
                  onClick={() => setBeatsPerMeasure(ts.beats)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    beatsPerMeasure === ts.beats
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-500/25'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {ts.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: Play/Stop & Tap Tempo */}
          <div className="grid grid-cols-2 gap-3 pt-3 relative z-10">
            <button
              id="metronome-start-stop-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-xl ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-5 h-5 fill-white" />
                  <span>توقف مترونوم</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  <span>شروع مترونوم</span>
                </>
              )}
            </button>

            <button
              id="metronome-tap-btn"
              onClick={handleTapTempo}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#F0F0F2] font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
            >
              <HandMetal className="w-5 h-5 text-indigo-400" />
              <span>تپ تمپو (Tap Tempo)</span>
            </button>
          </div>
        </div>

        {/* Rhythm Accuracy Trainer & Mini Game */}
        <div className="lg:col-span-5 bg-[#131317] border border-white/10 rounded-[28px] p-6 shadow-2xl space-y-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/5 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-[#F0F0F2] flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>بازی سنجش دقت ضرب‌آهنگ</span>
              </h3>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-0.5 rounded-full font-bold">
                امتیاز: {accuracyScore}
              </span>
            </div>

            <p className="text-xs text-white/60 mt-3 leading-relaxed">
              مترونوم را روشن کنید و سعی کنید دقیقا همزمان با شنیدن ضربه‌ها روی دکمه زیر تپ بزنید. سیستم خطای زمانی شما را به میلی‌ثانیه می‌سنجد!
            </p>
          </div>

          {/* Big Tap Button */}
          <div className="text-center space-y-3 relative z-10">
            <button
              id="rhythm-game-tap-btn"
              onClick={handleGameTap}
              disabled={!isPlaying}
              className={`w-full py-8 rounded-[24px] font-black text-lg transition-all transform active:scale-95 shadow-xl flex flex-col items-center justify-center gap-1 ${
                isPlaying
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 border border-indigo-400/40 cursor-pointer'
                  : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed opacity-60'
              }`}
            >
              <span className="text-xl">تپ روی ضرب (TAP ON BEAT)</span>
              <span className="text-xs font-normal text-indigo-200">
                {isPlaying ? 'دقیقا روی ثانیه ضربه لمس کنید' : 'ابتدا مترونوم را روشن کنید'}
              </span>
            </button>
          </div>

          {/* Feedback Log */}
          <div className="bg-[#0F0F12] p-4 rounded-2xl border border-white/10 space-y-2 min-h-[100px] relative z-10">
            <div className="text-[11px] font-semibold text-white/50 flex items-center justify-between">
              <span>گزارش آخرین ضربات شما:</span>
              <span className="text-white/40 font-latin text-[10px]">ms Offset</span>
            </div>

            {userTaps.length === 0 ? (
              <div className="text-xs text-white/40 text-center py-4">هنوز ضربه‌ای ثبت نشده است.</div>
            ) : (
              <div className="space-y-1.5">
                {userTaps.map((tap, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs px-3 py-1.5 bg-white/5 rounded-xl border border-white/5"
                  >
                    <span className={`font-semibold ${tap.offsetMs === 0 || Math.abs(tap.offsetMs) < 40 ? 'text-emerald-400' : 'text-indigo-300'}`}>
                      {tap.rating}
                    </span>
                    <span className="font-latin text-[11px] text-white/50">
                      {tap.offsetMs > 0 ? `+${tap.offsetMs}` : tap.offsetMs} ms
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
