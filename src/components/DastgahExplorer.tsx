import React, { useState } from 'react';
import { 
  Compass, 
  Play, 
  Volume2, 
  Sparkles, 
  BookOpen, 
  Music, 
  Radio, 
  Info, 
  Disc, 
  Check 
} from 'lucide-react';
import { DastgahScale, InstrumentTimbre } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { PERSIAN_DASTGAHS } from '../data/dastgahs';

interface DastgahExplorerProps {
  currentTimbre: InstrumentTimbre;
  onAskMaestro?: (prompt: string) => void;
}

export const DastgahExplorer: React.FC<DastgahExplorerProps> = ({ currentTimbre, onAskMaestro }) => {
  const [selectedDastgah, setSelectedDastgah] = useState<DastgahScale>(PERSIAN_DASTGAHS[0]);
  const [isPlayingScale, setIsPlayingScale] = useState<boolean>(false);
  const [activeNoteName, setActiveNoteName] = useState<string | null>(null);

  const handlePlayFullScale = async () => {
    if (isPlayingScale) return;
    setIsPlayingScale(true);

    for (let i = 0; i < selectedDastgah.notes.length; i++) {
      const note = selectedDastgah.notes[i];
      setActiveNoteName(note.name);
      audioEngine.playNote(note.name, currentTimbre, 0.7, note.centsOffset || 0);
      await new Promise((r) => setTimeout(r, 450));
    }

    setActiveNoteName(null);
    setIsPlayingScale(false);
  };

  const handlePlaySingleNote = (note: { name: string; centsOffset?: number }) => {
    setActiveNoteName(note.name);
    audioEngine.playNote(note.name, currentTimbre, 1.2, note.centsOffset || 0);
    setTimeout(() => setActiveNoteName(null), 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-[28px] p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                <Compass className="w-5 h-5" />
              </div>
              <span>کاوشگر دستگاه‌های موسیقی اصیل ایرانی و ریزپرده‌ها</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              با نغمات، گوشه‌ها، حس و حال معنوی و ریزپرده‌های کُرن (Koron) و سری (Sori) در ردیف موسیقی ایران آشنا شوید.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3.5 py-1.5 rounded-full font-bold shadow-2xs">
              سیستم ۲۴ ربع‌پرده‌ای ایرانی
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Dastgah Selector + Detailed View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar: Dastgah List */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-bold text-slate-500 px-1 mb-2">دستگاه‌ها و آوازهای اصلی:</div>
          {PERSIAN_DASTGAHS.map((dastgah) => {
            const isSelected = selectedDastgah.id === dastgah.id;
            return (
              <button
                key={dastgah.id}
                id={`dastgah-item-${dastgah.id}`}
                onClick={() => setSelectedDastgah(dastgah)}
                className={`w-full text-right p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-400/40 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>{dastgah.name}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1 font-medium">
                    {dastgah.character}
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                  isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-indigo-700 border-slate-200'
                }`}>
                  {dastgah.rootNote.slice(0, 1)}
                </div>
              </button>
            );
          })}
        </div>

        {/* Content: Selected Dastgah Details & Interactive Player */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Showcase Card */}
          <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-artistic-grid opacity-20 pointer-events-none"></div>

            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200 relative z-10">
              <div>
                <span className="text-xs font-latin text-indigo-600 tracking-wider uppercase font-bold">
                  {selectedDastgah.englishName}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  {selectedDastgah.name}
                </h3>
              </div>

              <button
                id="play-dastgah-scale-btn"
                onClick={handlePlayFullScale}
                disabled={isPlayingScale}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isPlayingScale ? 'در حال نواختن گام...' : 'شنیدن درجات و فواصل گام'}</span>
              </button>
            </div>

            {/* Character & Mood Description */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 relative z-10 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <Info className="w-4 h-4 text-indigo-600" />
                <span>حس و حال و ویژگی‌های نغمگی:</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                {selectedDastgah.description}
              </p>
              <div className="text-xs text-indigo-700 font-bold pt-1">
                رنگ احساسی: {selectedDastgah.character}
              </div>
            </div>

            {/* Interactive Notes & Microtones Scale Steps */}
            <div className="relative z-10">
              <div className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                <span>درجات گام (برای شنیدن هر نت روی آن کلیک کنید):</span>
                <span className="text-[11px] text-indigo-600 font-bold">ریزپرده‌های کرن دار با فرکانس دقیق ربع‌پرده‌ای</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                {selectedDastgah.notes.map((note, index) => {
                  const isKoron = note.accidental === 'koron';
                  const isSori = note.accidental === 'sori';
                  const isCurrentActive = activeNoteName === note.name;

                  return (
                    <button
                      key={index}
                      id={`dastgah-note-${index}`}
                      onClick={() => handlePlaySingleNote(note)}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-2xs cursor-pointer ${
                        isCurrentActive
                          ? 'bg-indigo-600 text-white border-indigo-600 scale-105 shadow-md shadow-indigo-500/20'
                          : isKoron || isSori
                          ? 'bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-400 hover:bg-amber-100/60'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 font-mono">درجه {index + 1}</span>
                      <span className="text-sm font-black my-1">{note.farsi}</span>
                      <span className="font-latin text-[10px] opacity-70 font-semibold">{note.name}</span>
                      {isKoron && (
                        <span className="mt-1 text-[9px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">
                          -۵۰ سنت
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Goushehs & Famous Repertoire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 relative z-10">
              {/* Famous Goushehs */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>گوشه‌های مهم و شاهکار:</span>
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedDastgah.famousGoushehs.map((gousheh, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white text-slate-700 px-3 py-1 rounded-full border border-slate-200 font-medium shadow-2xs"
                    >
                      {gousheh}
                    </span>
                  ))}
                </div>
              </div>

              {/* Popular Pieces */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-indigo-600" />
                  <span>آثار و تصنیف‌های ماندگار:</span>
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                  {selectedDastgah.popularPieces.map((piece, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      <span>{piece}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Ask AI Maestro prompt */}
            {onAskMaestro && (
              <div className="pt-2 flex justify-end relative z-10">
                <button
                  onClick={() => onAskMaestro(`لطفاً گوشه‌های مهم و شیوه مدولاسیون (مرکب‌خوانی) از ${selectedDastgah.name} به سایر دستگاه‌ها را به زبان ساده توضیح دهید.`)}
                  className="text-xs text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full border border-indigo-200 font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>پرسش از مربی هوشمند درباره مرکب‌خوانی و گوشه‌های {selectedDastgah.name}...</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
