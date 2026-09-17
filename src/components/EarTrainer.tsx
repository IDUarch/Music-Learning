import React, { useState, useEffect } from 'react';
import { 
  Headphones, 
  Play, 
  Volume2, 
  Sparkles, 
  Award, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Layers, 
  Wand2 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { InstrumentTimbre, EarTrainingQuestion } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { EAR_TRAINING_QUESTIONS } from '../data/earTraining';

interface EarTrainerProps {
  currentTimbre: InstrumentTimbre;
  onUpdateScore: (points: number) => void;
}

export const EarTrainer: React.FC<EarTrainerProps> = ({ currentTimbre, onUpdateScore }) => {
  const [questions, setQuestions] = useState<EarTrainingQuestion[]>(EAR_TRAINING_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [playbackMode, setPlaybackMode] = useState<'melodic' | 'harmonic'>('melodic');
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState<boolean>(false);
  const [aiTopic, setAiTopic] = useState<string>('فواصل و آکوردها');
  const [aiDifficulty, setAiDifficulty] = useState<string>('متوسط');

  const currentQ = questions[currentIndex] || questions[0];

  const playCurrentAudio = async () => {
    if (!currentQ || isPlayingAudio) return;
    setIsPlayingAudio(true);

    if (currentQ.type === 'chord' || playbackMode === 'harmonic') {
      audioEngine.playChord(currentQ.notesToPlay, currentTimbre, 2.0);
      setTimeout(() => setIsPlayingAudio(false), 2000);
    } else {
      // Melodic sequential
      for (let i = 0; i < currentQ.notesToPlay.length; i++) {
        audioEngine.playNote(currentQ.notesToPlay[i], currentTimbre, 0.8);
        await new Promise((r) => setTimeout(r, 600));
      }
      setIsPlayingAudio(false);
    }
  };

  useEffect(() => {
    setSelectedOption(null);
    setIsAnswered(false);
    // Auto play question sound
    const timer = setTimeout(() => {
      playCurrentAudio();
    }, 200);
    return () => clearTimeout(timer);
  }, [currentIndex, questions]);

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const points = 15 + newStreak * 5;
      setScore((prev) => prev + points);
      onUpdateScore(points);

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Loop or restart
      setCurrentIndex(0);
    }
  };

  // Generate new quiz using Gemini AI
  const handleGenerateAiQuiz = async () => {
    setIsGeneratingAiQuiz(true);
    try {
      const res = await fetch('/api/gemini/quiz-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, difficulty: aiDifficulty }),
      });
      const data = await res.json();
      if (data && data.question && Array.isArray(data.options)) {
        const newQuestion: EarTrainingQuestion = {
          id: `ai-${Date.now()}`,
          type: 'interval',
          title: `کوییز هوشمند امیتیس (${aiTopic})`,
          prompt: data.question,
          options: data.options,
          correctIndex: data.correctIndex || 0,
          explanation: data.explanation || 'توضیح مربی هوشمند امیتیس',
          notesToPlay: data.playableNotes && data.playableNotes.length > 0 ? data.playableNotes : ['C4', 'E4', 'G4'],
        };
        setQuestions((prev) => [newQuestion, ...prev]);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Failed to generate quiz:', err);
    } finally {
      setIsGeneratingAiQuiz(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white border border-slate-200 rounded-[28px] p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200/80 relative z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                <Headphones className="w-5 h-5" />
              </div>
              <span>تربیت شنوایی و دیکته موسیقی (Ear Training)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              توانایی گوش خود را در تشخیص فواصل، آکوردها و ملودی‌ها بسنجید.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-amber-700 font-bold bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200 text-xs shadow-2xs">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>پیوستگی: {streak}</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-700 font-bold bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-200 text-xs shadow-2xs">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>امتیاز کل: {score}</span>
            </div>
          </div>
        </div>

        {/* AI Quiz Generator Bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600 font-bold flex items-center gap-1">
              <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>ساخت کوییز هوشمند:</span>
            </span>
            <select
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-indigo-800 font-bold rounded-full px-3 py-1.5 focus:outline-none focus:border-indigo-500 shadow-2xs"
            >
              <option value="فواصل ملودیک و هارمونیک">فواصل ملودیک</option>
              <option value="تشخیص کیفیت آکوردهای ماژور و مینور">آکوردهای ماژور و مینور</option>
              <option value="آکوردهای جاز و هفتم (7th)">آکوردهای هفتم و جاز</option>
              <option value="دیکته ملودی و سلفژ">دیکته ملودی</option>
              <option value="دستگاه‌های ایرانی و گوشه‌ها">دستگاه‌های ایرانی</option>
            </select>
            <select
              value={aiDifficulty}
              onChange={(e) => setAiDifficulty(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-full px-3 py-1.5 focus:outline-none focus:border-indigo-500 shadow-2xs"
            >
              <option value="مقدماتی">مقدماتی</option>
              <option value="متوسط">متوسط</option>
              <option value="پیشرفته">پیشرفته</option>
            </select>
            <button
              id="generate-ai-quiz-btn"
              onClick={handleGenerateAiQuiz}
              disabled={isGeneratingAiQuiz}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingAiQuiz ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>در حال ساخت...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>تولید کوییز</span>
                </>
              )}
            </button>
          </div>

          <div className="text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
            سوال {currentIndex + 1} از {questions.length}
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white border border-slate-200 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-artistic-grid opacity-20 pointer-events-none"></div>

        <div className="flex items-center justify-between relative z-10">
          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3.5 py-1 rounded-full font-bold shadow-2xs">
            {currentQ.title}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlaybackMode(playbackMode === 'melodic' ? 'harmonic' : 'melodic')}
              className="text-xs bg-slate-100 px-3.5 py-1 rounded-full border border-slate-200 text-slate-700 hover:text-slate-900 font-medium transition-colors shadow-2xs"
            >
              حالت پخش: {playbackMode === 'melodic' ? 'پشت سر هم (ملودیک)' : 'همزمان (هارمونیک)'}
            </button>
          </div>
        </div>

        <div className="text-center py-4 space-y-4 relative z-10">
          <p className="text-base sm:text-lg font-bold text-slate-900">
            {currentQ.prompt}
          </p>

          {/* Big Interactive Audio Play Button */}
          <div className="flex justify-center">
            <button
              id="ear-training-play-btn"
              onClick={playCurrentAudio}
              disabled={isPlayingAudio}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all shadow-xl cursor-pointer ${
                isPlayingAudio
                  ? 'bg-indigo-600 text-white scale-110 shadow-indigo-500/50 ring-4 ring-indigo-400/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 shadow-indigo-600/30'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <div className="flex items-end gap-1 h-5">
                    <span className="w-1 bg-white rounded animate-bounce" style={{ height: '16px' }}></span>
                    <span className="w-1 bg-white rounded animate-bounce" style={{ height: '24px', animationDelay: '0.15s' }}></span>
                    <span className="w-1 bg-white rounded animate-bounce" style={{ height: '12px', animationDelay: '0.3s' }}></span>
                  </div>
                  <span className="text-[10px] font-bold">در حال پخش...</span>
                </>
              ) : (
                <>
                  <Play className="w-8 h-8 fill-current ml-1" />
                  <span className="text-[11px] font-bold">پخش صدا</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 font-medium">برای شنیدن دوباره صدا، دکمه بالا را لمس کنید.</p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 relative z-10">
          {currentQ.options.map((option, idx) => {
            let optionStyles = 'bg-slate-50 border-slate-200 hover:border-indigo-500 text-slate-800 hover:bg-indigo-50/50';
            if (isAnswered) {
              if (idx === currentQ.correctIndex) {
                optionStyles = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold ring-2 ring-emerald-400/50';
              } else if (idx === selectedOption) {
                optionStyles = 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-400/50';
              } else {
                optionStyles = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
              }
            }

            return (
              <button
                key={idx}
                id={`et-option-${idx}`}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={`p-4 rounded-2xl border text-sm text-right transition-all flex items-center justify-between gap-3 shadow-2xs font-medium cursor-pointer ${optionStyles}`}
              >
                <span>{option}</span>
                {isAnswered && idx === currentQ.correctIndex && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next Step */}
        {isAnswered && (
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-3 animate-in fade-in duration-200 relative z-10 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>تحلیل علمی پاسخ:</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              {currentQ.explanation}
            </p>

            <div className="flex justify-end pt-2">
              <button
                id="et-next-btn"
                onClick={handleNext}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span>سوال بعدی</span>
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
