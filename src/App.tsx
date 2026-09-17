/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Piano, 
  Eye, 
  Headphones, 
  Compass, 
  BookOpen, 
  Guitar, 
  Timer, 
  Bot, 
  Search, 
  Sparkles, 
  Music, 
  Volume2, 
  Award, 
  Flame, 
  Trophy, 
  Play,
  Radio,
  Zap
} from 'lucide-react';
import { InstrumentTimbre, AppTab } from './types';
import { Header } from './components/Header';
import { SmartPiano } from './components/SmartPiano';
import { SightReadingTrainer } from './components/SightReadingTrainer';
import { EarTrainer } from './components/EarTrainer';
import { DastgahExplorer } from './components/DastgahExplorer';
import { LessonsHub } from './components/LessonsHub';
import { LearningRoadmap } from './components/LearningRoadmap';
import { NotationNotebook } from './components/NotationNotebook';
import { FretboardVisualizer } from './components/FretboardVisualizer';
import { MetronomeTrainer } from './components/MetronomeTrainer';
import { AiMaestroChat } from './components/AiMaestroChat';
import { MusicSearchLab } from './components/MusicSearchLab';
import { audioEngine } from './utils/audioEngine';

const FUN_MELODIES = [
  { name: 'فور الیزه (Für Elise)', notes: ['E5', 'D#5', 'E5', 'D#5', 'E5', 'B4', 'D5', 'C5', 'A4'], timbre: 'piano' as InstrumentTimbre },
  { name: 'چهارمضراب شور (ایرانی)', notes: ['G4', 'A4', 'B4', 'C5', 'D5', 'C5', 'B4', 'A4', 'G4'], timbre: 'harp' as InstrumentTimbre },
  { name: 'ملودی جاز و بلوز (Jazz)', notes: ['C4', 'Eb4', 'F4', 'F#4', 'G4', 'Bb4', 'C5'], timbre: 'guitar' as InstrumentTimbre },
  { name: 'تم حماسی (Theme)', notes: ['A4', 'D5', 'F5', 'G5', 'A5', 'F5', 'D5'], timbre: 'synth' as InstrumentTimbre },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('piano');
  const [currentTimbre, setCurrentTimbre] = useState<InstrumentTimbre>('piano');
  const [userScore, setUserScore] = useState<number>(() => {
    const saved = localStorage.getItem('emitis_user_score');
    return saved ? Number(saved) : 150;
  });
  const [userStreak, setUserStreak] = useState<number>(() => {
    const saved = localStorage.getItem('emitis_user_streak');
    return saved ? Number(saved) : 5;
  });
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    const saved = localStorage.getItem('emitis_completed_lessons');
    return saved ? JSON.parse(saved) : ['l1'];
  });
  const [maestroPrompt, setMaestroPrompt] = useState<string>('');
  const [isPlayingDemo, setIsPlayingDemo] = useState<string | null>(null);

  // Persist progress to local storage
  useEffect(() => {
    localStorage.setItem('emitis_user_score', userScore.toString());
  }, [userScore]);

  useEffect(() => {
    localStorage.setItem('emitis_user_streak', userStreak.toString());
  }, [userStreak]);

  useEffect(() => {
    localStorage.setItem('emitis_completed_lessons', JSON.stringify(completedLessons));
  }, [completedLessons]);

  const handleUpdateScore = (points: number) => {
    setUserScore((prev) => prev + points);
  };

  const handleCompleteLesson = (lessonId: string, points: number) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons((prev) => [...prev, lessonId]);
      setUserScore((prev) => prev + points);
    }
  };

  const handleAskMaestro = (prompt: string) => {
    setMaestroPrompt(prompt);
    setActiveTab('ai-maestro');
  };

  const playDemoMelody = async (mel: typeof FUN_MELODIES[0]) => {
    if (isPlayingDemo) return;
    setIsPlayingDemo(mel.name);
    for (const note of mel.notes) {
      audioEngine.playNote(note, mel.timbre, 0.45);
      await new Promise((r) => setTimeout(r, 260));
    }
    setIsPlayingDemo(null);
  };

  // Calculate level based on score
  const userLevel = Math.max(1, Math.floor(userScore / 150) + 1);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white relative overflow-hidden font-sans">
      {/* Energetic Background Glow Mesh (Bright & Vibrant) */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute top-2/3 right-1/4 w-[400px] h-[400px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-sky-500/10 blur-[130px] rounded-full pointer-events-none"></div>

      {/* Top Main Navigation Header */}
      <Header
        currentTab={activeTab === 'dastgahs' ? 'dastgah' : activeTab === 'lessons' ? 'learn' : activeTab === 'search-lab' ? 'search-grounding' : activeTab}
        onSelectTab={(tab) => {
          if (tab === 'learn') setActiveTab('lessons');
          else if (tab === 'dastgah') setActiveTab('dastgahs');
          else if (tab === 'search-grounding') setActiveTab('search-lab');
          else setActiveTab(tab as AppTab);
        }}
        currentTimbre={currentTimbre}
        onChangeTimbre={setCurrentTimbre}
        streakDays={userStreak}
        totalScore={userScore}
      />

      {/* Fun Interactive Audio Jukebox & Studio Motivation Strip */}
      <div className="bg-white/80 border-b border-slate-200/80 px-4 sm:px-6 py-2.5 backdrop-blur-md relative z-20 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Quick Melody Jukebox */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
              <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>جاک‌باکس ملودی:</span>
            </span>
            {FUN_MELODIES.map((mel, idx) => (
              <button
                key={idx}
                onClick={() => playDemoMelody(mel)}
                disabled={isPlayingDemo !== null}
                className={`px-3 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isPlayingDemo === mel.name
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/30 scale-105'
                    : 'bg-slate-100/90 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <Play className={`w-3 h-3 ${isPlayingDemo === mel.name ? 'fill-white animate-spin' : 'fill-slate-500'}`} />
                <span>{mel.name}</span>
              </button>
            ))}
          </div>

          {/* Gamification & Live Sound Waves */}
          <div className="flex items-center gap-4 text-slate-600">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[11px]">محیط زنده استودیو فعال</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full text-[11px] font-bold">
              <Trophy className="w-3.5 h-3.5 text-indigo-600" />
              <span>مرحله {userLevel} نوازنده</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-20 relative z-10">
        {activeTab === 'roadmap' && (
          <LearningRoadmap
            currentTimbre={currentTimbre}
            onUpdateScore={handleUpdateScore}
            onNavigateTab={setActiveTab}
            onAskMaestro={handleAskMaestro}
          />
        )}

        {activeTab === 'notation-notebook' && (
          <NotationNotebook
            currentTimbre={currentTimbre}
            onUpdateScore={handleUpdateScore}
            onNavigateTab={setActiveTab}
            onAskMaestro={handleAskMaestro}
          />
        )}

        {activeTab === 'piano' && (
          <SmartPiano currentTimbre={currentTimbre} onAskMaestro={handleAskMaestro} />
        )}

        {activeTab === 'sight-reading' && (
          <SightReadingTrainer
            currentTimbre={currentTimbre}
            onUpdateScore={handleUpdateScore}
          />
        )}

        {activeTab === 'ear-training' && (
          <EarTrainer
            currentTimbre={currentTimbre}
            onUpdateScore={handleUpdateScore}
          />
        )}

        {activeTab === 'dastgahs' && (
          <DastgahExplorer
            currentTimbre={currentTimbre}
            onAskMaestro={handleAskMaestro}
          />
        )}

        {activeTab === 'lessons' && (
          <LessonsHub
            currentTimbre={currentTimbre}
            completedLessonIds={completedLessons}
            onCompleteLesson={handleCompleteLesson}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'fretboard' && (
          <FretboardVisualizer
            currentTimbre={currentTimbre}
            onAskMaestro={handleAskMaestro}
          />
        )}

        {activeTab === 'metronome' && (
          <MetronomeTrainer onUpdateScore={handleUpdateScore} />
        )}

        {activeTab === 'ai-maestro' && (
          <AiMaestroChat
            currentTimbre={currentTimbre}
            initialPrompt={maestroPrompt}
          />
        )}

        {activeTab === 'search-lab' && <MusicSearchLab />}
      </main>

      {/* Modern Bright Studio Footer */}
      <footer className="border-t border-slate-200 bg-white/90 py-6 px-4 sm:px-6 relative z-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-slate-700 font-medium">موتور صوتی تعاملی Web Audio API با شفافیت استودیویی ۴۴۰ هرتز (A4)</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600">
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-latin">ساز منتخب روز</span>
              <span className="text-xs font-bold text-slate-800">تار ایرانی و پیانو آکوستیک</span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-latin">کارگاه بعدی</span>
              <span className="text-xs font-bold text-indigo-600">ریتم‌خوانی و لنگ‌های ایرانی</span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="font-black text-indigo-600 font-latin text-base italic tracking-tight">EMITIS</span>
              <span className="text-[11px] text-slate-500">© آکادمی موسیقی امیتیس</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

