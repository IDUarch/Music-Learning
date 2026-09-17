import React, { useState, useEffect } from 'react';
import {
  Milestone,
  CheckCircle2,
  Lock,
  Play,
  Volume2,
  Award,
  Sparkles,
  Flame,
  ArrowRight,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Trophy,
  ExternalLink,
  Bot,
  Lightbulb,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Timer,
  Eye,
  Headphones,
  Compass,
  Piano,
  Zap,
  Smile,
  Gamepad2,
  GraduationCap,
  Heart,
  VolumeX,
  Volume1,
  Stars
} from 'lucide-react';
import { RoadmapStage, RoadmapExamQuestion, InstrumentTimbre, AppTab, AgeGroup } from '../types';
import { ROADMAP_STAGES } from '../data/roadmapData';
import { audioEngine } from '../utils/audioEngine';
import confetti from 'canvas-confetti';

interface LearningRoadmapProps {
  currentTimbre: InstrumentTimbre;
  onUpdateScore: (points: number) => void;
  onNavigateTab: (tab: AppTab) => void;
  onAskMaestro: (prompt: string) => void;
}

const AGE_CONFIGS: Record<
  AgeGroup,
  {
    id: AgeGroup;
    label: string;
    ageRange: string;
    description: string;
    icon: React.ReactNode;
    badgeColor: string;
    bgAccent: string;
    borderAccent: string;
    bannerGradient: string;
    mascot: string;
  }
> = {
  kids: {
    id: 'kids',
    label: 'کودکان و نوآموزان خردسال',
    ageRange: '۵ تا ۱۰ سال',
    description: 'توضیحات خیلی ساده، داستانی و مینیمال با بازی حیوانات و شکل‌های شاد 🐱🎈',
    icon: <Smile className="w-5 h-5" />,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    bgAccent: 'bg-amber-50/70',
    borderAccent: 'border-amber-200 hover:border-amber-400',
    bannerGradient: 'from-amber-400 via-rose-400 to-pink-500',
    mascot: '🐱',
  },
  teens: {
    id: 'teens',
    label: 'نوجوانان و دوستداران موزیک',
    ageRange: '۱۰ تا ۱۵ سال',
    description: 'چیت‌کدها، ریتم‌های گیمینگ و انیمه‌ها، ترفندهای بیت‌سازی و کیبورد ⚡🎧',
    icon: <Gamepad2 className="w-5 h-5" />,
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    bgAccent: 'bg-indigo-50/70',
    borderAccent: 'border-indigo-200 hover:border-indigo-400',
    bannerGradient: 'from-indigo-600 via-purple-600 to-cyan-500',
    mascot: '⚡',
  },
  adults: {
    id: 'adults',
    label: 'بزرگسالان و آکادمیک',
    ageRange: '۱۵ سال به بالا',
    description: 'تئوری دقیق و علمی، فیزیک صوت، هارمونی کلاسیک، ردیف ایرانی و آنالیز ساختاری 🎼🏛️',
    icon: <GraduationCap className="w-5 h-5" />,
    badgeColor: 'bg-slate-800 text-amber-200 border-slate-700',
    bgAccent: 'bg-slate-50/80',
    borderAccent: 'border-slate-300 hover:border-slate-500',
    bannerGradient: 'from-slate-900 via-indigo-950 to-slate-800',
    mascot: '🎼',
  },
};

export const LearningRoadmap: React.FC<LearningRoadmapProps> = ({
  currentTimbre,
  onUpdateScore,
  onNavigateTab,
  onAskMaestro,
}) => {
  // Age bracket state (persisted)
  const [currentAgeGroup, setCurrentAgeGroup] = useState<AgeGroup>(() => {
    const saved = localStorage.getItem('emitis_roadmap_age_group');
    if (saved === 'kids' || saved === 'teens' || saved === 'adults') {
      return saved;
    }
    return 'kids'; // default friendly start
  });

  // Saved progress: array of unlocked stage IDs, and record of stage exam scores
  const [unlockedStages, setUnlockedStages] = useState<string[]>(() => {
    const saved = localStorage.getItem('emitis_roadmap_unlocked');
    return saved ? JSON.parse(saved) : ['stage-1'];
  });

  const [passedStages, setPassedStages] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('emitis_roadmap_passed');
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedStageId, setSelectedStageId] = useState<string>('stage-1');

  // Exam state
  const [isTakingExam, setIsTakingExam] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [examCorrectCount, setExamCorrectCount] = useState<number>(0);
  const [examFinished, setExamFinished] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem('emitis_roadmap_age_group', currentAgeGroup);
  }, [currentAgeGroup]);

  useEffect(() => {
    localStorage.setItem('emitis_roadmap_unlocked', JSON.stringify(unlockedStages));
  }, [unlockedStages]);

  useEffect(() => {
    localStorage.setItem('emitis_roadmap_passed', JSON.stringify(passedStages));
  }, [passedStages]);

  const selectedStage = ROADMAP_STAGES.find((s) => s.id === selectedStageId) || ROADMAP_STAGES[0];
  const isSelectedUnlocked = unlockedStages.includes(selectedStage.id);
  const isSelectedPassed = passedStages[selectedStage.id] !== undefined;

  // Active age-adapted content
  const ageData = selectedStage.ageAdaptations?.[currentAgeGroup];
  const currentTitle = ageData?.stageTitle || selectedStage.title;
  const currentSubtitle = ageData?.stageSubtitle || selectedStage.subtitle;
  const currentStory = ageData?.storyExplanation;
  const currentWhyOrder = ageData?.whyThisOrder || selectedStage.whyThisOrder;
  const currentCoreConcepts = ageData?.coreConcepts || selectedStage.coreConcepts;
  const currentKeyHacks = ageData?.keyHacks || selectedStage.keyHacks;
  const currentQuestions: RoadmapExamQuestion[] = (ageData?.examQuestions && ageData.examQuestions.length > 0)
    ? ageData.examQuestions
    : selectedStage.examQuestions;

  // Total stats
  const totalStages = ROADMAP_STAGES.length;
  const passedCount = Object.keys(passedStages).length;
  const progressPercent = Math.round((passedCount / totalStages) * 100);

  // Start exam for current stage
  const handleStartExam = () => {
    setIsTakingExam(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsAnswerSubmitted(false);
    setExamCorrectCount(0);
    setExamFinished(false);
  };

  // Play audio notes for exam question
  const handlePlayQuestionAudio = async (notes?: string[]) => {
    if (!notes || notes.length === 0 || isPlayingAudio) return;
    setIsPlayingAudio(true);
    for (const note of notes) {
      audioEngine.playNote(note, currentTimbre, 0.48);
      await new Promise((r) => setTimeout(r, 340));
    }
    setIsPlayingAudio(false);
  };

  // Select an answer in the exam
  const handleSelectAnswer = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswerIndex(index);
    setIsAnswerSubmitted(true);

    const q = currentQuestions[currentQuestionIndex];
    if (index === q.correctIndex) {
      setExamCorrectCount((prev) => prev + 1);
      // Play cheerful chord
      audioEngine.playNote('C5', currentTimbre, 0.25);
    } else {
      // Play soft low note
      audioEngine.playNote('F3', currentTimbre, 0.25);
    }
  };

  // Next question or finish
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < currentQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswerIndex(null);
      setIsAnswerSubmitted(false);
    } else {
      finishExam();
    }
  };

  const finishExam = () => {
    const totalQ = currentQuestions.length;
    const finalScorePercent = Math.round((examCorrectCount / totalQ) * 100);
    const passed = finalScorePercent >= selectedStage.passingScorePercent;

    if (passed) {
      setPassedStages((prev) => ({
        ...prev,
        [selectedStage.id]: finalScorePercent,
      }));

      // Unlock next stage if exists
      const currentIndex = ROADMAP_STAGES.findIndex((s) => s.id === selectedStage.id);
      if (currentIndex + 1 < ROADMAP_STAGES.length) {
        const nextStage = ROADMAP_STAGES[currentIndex + 1];
        setUnlockedStages((prev) => {
          if (!prev.includes(nextStage.id)) {
            return [...prev, nextStage.id];
          }
          return prev;
        });
      }

      // Award XP
      onUpdateScore(selectedStage.xpReward);

      // Play victory fanfare & fire confetti
      playVictoryChime();
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore if not supported
      }
    }

    setExamFinished(true);
  };

  const playVictoryChime = async () => {
    const victoryNotes = ['C4', 'E4', 'G4', 'C5'];
    for (const note of victoryNotes) {
      audioEngine.playNote(note, 'piano', 0.35);
      await new Promise((r) => setTimeout(r, 120));
    }
  };

  const resetAllProgress = () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید پیشرفت آزمون‌ها را از ابتدا بازنشانی کنید؟')) {
      setUnlockedStages(['stage-1']);
      setPassedStages({});
      setSelectedStageId('stage-1');
      setIsTakingExam(false);
    }
  };

  const handleConsultAiMaestro = () => {
    let tonePrompt = '';
    if (currentAgeGroup === 'kids') {
      tonePrompt = `لطفاً مانند یک معلم مهربان و با زبان بسیار ساده، داستانی و پر از تمثیل برای یک کودک ۵ تا ۱۰ ساله، مبحث «${currentTitle}» (مرحله ${selectedStage.stepNumber}) را توضیح بده و راهنمایی کن.`;
    } else if (currentAgeGroup === 'teens') {
      tonePrompt = `لطفاً مبحث «${currentTitle}» (مرحله ${selectedStage.stepNumber}) را با مثال‌های خفن و جذاب آهنگ‌های ترند، بیت‌سازی و چیت‌کدهای سریع برای یک نوجوان ۱۰ تا ۱۵ ساله آموزش بده.`;
    } else {
      tonePrompt = `لطفاً مبحث «${currentTitle}» (مرحله ${selectedStage.stepNumber}) را به صورت عمیق، آکادمیک و با رویکرد هارمونی ساختاری و ردیف موسیقی ایرانی برای بزرگسالان تحلیل بفرمایید.`;
    }
    onAskMaestro(tonePrompt);
  };

  const activeAgeConfig = AGE_CONFIGS[currentAgeGroup];

  return (
    <div className="space-y-6">
      {/* 1. Top Section: Age Bracket Persona Selector */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black text-xs rounded-full border border-indigo-200/70 flex items-center gap-1.5 shadow-2xs">
                <Stars className="w-3.5 h-3.5 text-indigo-600" />
                <span>شخصی‌سازی لحن و رده سنی</span>
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                (تغییر لحن توضیحات، داستان‌ها و آزمون‌ها بر اساس سن)
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <span>مسیر ۹ گانه یادگیری موسیقی امیتیس</span>
            </h2>
          </div>

          {/* Quick Progress Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 font-bold px-3.5 py-1.5 rounded-full border border-emerald-200 text-xs shadow-2xs">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <span>مراحل پاس شده: {passedCount} از {totalStages}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 font-bold px-3.5 py-1.5 rounded-full border border-amber-200 text-xs shadow-2xs">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{progressPercent}٪ تکمیل</span>
            </div>
          </div>
        </div>

        {/* 3 Age Tabs with Rich Styling */}
        <div className="pt-4 space-y-3">
          <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
            <span>رده سنی خود را انتخاب کنید تا تمام آموزش‌ها و آزمون‌ها متناسب با درک شما شوند:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.values(AGE_CONFIGS) as (typeof AGE_CONFIGS)['kids'][]).map((cfg) => {
              const isActive = currentAgeGroup === cfg.id;
              return (
                <button
                  key={cfg.id}
                  id={`age-bracket-btn-${cfg.id}`}
                  onClick={() => {
                    setCurrentAgeGroup(cfg.id);
                    setIsTakingExam(false);
                  }}
                  className={`text-right p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 cursor-pointer relative overflow-hidden shadow-2xs ${
                    isActive
                      ? cfg.id === 'kids'
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50/80 border-amber-400 ring-2 ring-amber-400/40 text-amber-950 shadow-sm'
                        : cfg.id === 'teens'
                        ? 'bg-gradient-to-br from-indigo-50 to-purple-50/80 border-indigo-500 ring-2 ring-indigo-400/40 text-indigo-950 shadow-sm'
                        : 'bg-gradient-to-br from-slate-900 to-indigo-950 border-slate-700 ring-2 ring-slate-600 text-white shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                          isActive
                            ? cfg.id === 'adults'
                              ? 'bg-amber-400 text-slate-950 border-amber-300'
                              : 'bg-white text-indigo-700 border-indigo-200 shadow-2xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {cfg.icon}
                      </div>
                      <div>
                        <div className="font-black text-sm flex items-center gap-1.5">
                          <span>{cfg.label}</span>
                          {isActive && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                        </div>
                        <div
                          className={`text-[11px] font-bold mt-0.5 ${
                            isActive && cfg.id === 'adults' ? 'text-amber-300' : 'text-slate-500'
                          }`}
                        >
                          سن: {cfg.ageRange}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p
                    className={`text-xs leading-relaxed font-medium ${
                      isActive && cfg.id === 'adults' ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {cfg.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Progress Bar with Rainbow Gradient */}
        <div className="pt-5 space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
            <span>پیشرفت در کل دوره‌های نقشه راه امیتیس</span>
            <span className="text-indigo-600 font-bold font-latin">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-0.5">
            <div
              className={`h-full bg-gradient-to-r ${activeAgeConfig.bannerGradient} rounded-full transition-all duration-500 shadow-xs`}
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. Main Roadmap Layout: Sidebar Stepper + Active Stage Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stages Stepper Navigation (Left/Sidebar) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1 mb-1 text-xs font-bold text-slate-500">
            <span>مراحل ۹ گانه مسیر یادگیری:</span>
            <button
              onClick={resetAllProgress}
              className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
              title="شروع مجدد از مرحله اول"
            >
              <RotateCcw className="w-3 h-3" />
              <span>بازنشانی آزمون‌ها</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {ROADMAP_STAGES.map((stage) => {
              const isUnlocked = unlockedStages.includes(stage.id);
              const isPassed = passedStages[stage.id] !== undefined;
              const isSelected = selectedStage.id === stage.id;
              const score = passedStages[stage.id];
              const ageSpecific = stage.ageAdaptations?.[currentAgeGroup];
              const stepTitle = ageSpecific?.stageTitle || stage.title;

              return (
                <button
                  key={stage.id}
                  id={`roadmap-step-${stage.id}`}
                  onClick={() => {
                    setSelectedStageId(stage.id);
                    setIsTakingExam(false);
                  }}
                  className={`w-full text-right p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs relative overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 ring-2 ring-indigo-400/40 shadow-sm'
                      : isPassed
                      ? 'bg-white border-emerald-200 hover:border-emerald-300 text-slate-800'
                      : isUnlocked
                      ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Stage Number & Status Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border transition-all ${
                        isPassed
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                          : isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : isUnlocked
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                          : 'bg-slate-200 text-slate-400 border-slate-300'
                      }`}
                    >
                      {isPassed ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : !isUnlocked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <span>{stage.stepNumber}</span>
                      )}
                    </div>

                    <div>
                      <div className="font-bold text-xs sm:text-sm line-clamp-1 flex items-center gap-1.5">
                        <span>مرحله {stage.stepNumber}: {stepTitle}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 font-medium">
                        {stage.category}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0">
                    {isPassed ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {score}٪ ✓
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                        آماده آزمون
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-200 text-slate-500 font-medium px-2 py-0.5 rounded-full">
                        قفل
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage Content & Interactive Exam (Right/Main) */}
        <div className="lg:col-span-8 space-y-6">
          {!isTakingExam ? (
            /* STAGE OVERVIEW & STUDY GUIDE */
            <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-artistic-grid opacity-15 pointer-events-none"></div>

              {/* Stage Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 relative z-10">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-bold shadow-2xs">
                      مرحله {selectedStage.stepNumber} از {totalStages}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${activeAgeConfig.badgeColor}`}>
                      مناسب رده سنی: {activeAgeConfig.ageRange}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      زمان تمرین: ~{selectedStage.estimatedHours} ساعت
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {currentTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                    {currentSubtitle}
                  </p>
                </div>

                {/* Exam CTA */}
                <div className="shrink-0">
                  {isSelectedUnlocked ? (
                    <button
                      id="start-stage-exam-btn"
                      onClick={handleStartExam}
                      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>{isSelectedPassed ? 'شرکت مجدد در آزمون مرحله' : 'شروع آزمون و باز کردن مرحله بعد'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-100 text-slate-500 px-4 py-2.5 rounded-full text-xs font-semibold border border-slate-200">
                      <Lock className="w-4 h-4" />
                      <span>ابتدا آزمون مرحله قبل را پاس کنید</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Story / Gentle Analogy Section */}
              {currentStory && (
                <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/70 p-5 rounded-2xl border border-amber-200/90 space-y-2 relative z-10 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span>داستان و تمثیل شیرین این مرحله ({activeAgeConfig.label}):</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
                    {currentStory}
                  </p>
                </div>
              )}

              {/* Why This Order (Philosophy of Learning) */}
              <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-200 space-y-2 relative z-10 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <Lightbulb className="w-4 h-4 text-indigo-600" />
                  <span>چرا این مبحث در این مرحله قرار دارد؟ (فلسفه یادگیری اصولی):</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {currentWhyOrder}
                </p>
              </div>

              {/* Core Concepts */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 relative z-10 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>سرفصل‌ها و مفاهیم کلیدی که یاد می‌گیرید:</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  {currentCoreConcepts.map((concept, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <span className="font-medium">{concept}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Hacks & Master Tips */}
              <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 space-y-3 relative z-10 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>رازها و چیت‌کدهای استاد برای یادسپاری آسان:</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-emerald-950 font-medium">
                  {currentKeyHacks.map((hack, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                      <span>{hack}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons: Practice with App Tools & AI Maestro */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 relative z-10 border-t border-slate-200">
                <button
                  onClick={() => onNavigateTab(selectedStage.suggestedAppTab)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-full text-xs transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                  <span>تمرین عملی در: {selectedStage.tabLabel}</span>
                </button>

                <button
                  onClick={handleConsultAiMaestro}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold rounded-full text-xs transition-all border border-indigo-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-600" />
                  <span>تدریس خصوصی با لحن {activeAgeConfig.label}...</span>
                </button>
              </div>
            </div>
          ) : (
            /* INTERACTIVE STAGE EXAM */
            <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-artistic-grid opacity-15 pointer-events-none"></div>

              {!examFinished ? (
                /* ACTIVE QUESTION VIEW */
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-bold shadow-2xs">
                        آزمون مرحله {selectedStage.stepNumber}: {currentTitle}
                      </span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${activeAgeConfig.badgeColor}`}>
                        لحن {activeAgeConfig.ageRange}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-bold">
                        سوال {currentQuestionIndex + 1} از {currentQuestions.length}
                      </span>
                      <button
                        onClick={() => setIsTakingExam(false)}
                        className="text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        خروج
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const q = currentQuestions[currentQuestionIndex];
                    return (
                      <div className="space-y-6 relative z-10">
                        {/* Question Text Box */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                            {q.question}
                          </h4>

                          {/* Sound trigger button */}
                          {q.notesToPlay && q.notesToPlay.length > 0 && (
                            <div className="pt-2 flex items-center gap-3">
                              <button
                                id="exam-audio-play-btn"
                                onClick={() => handlePlayQuestionAudio(q.notesToPlay)}
                                disabled={isPlayingAudio}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
                              >
                                <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                                <span>{isPlayingAudio ? 'در حال نواختن صدا...' : 'شنیدن صدای نت یا آکورد'}</span>
                              </button>
                              <span className="text-xs text-slate-400 font-medium">برای شنیدن نمونه صوتی کلیک کنید</span>
                            </div>
                          )}
                        </div>

                        {/* Options Buttons */}
                        <div className="grid grid-cols-1 gap-3">
                          {q.options.map((option, idx) => {
                            let optionStyles = 'bg-slate-50 border-slate-200 hover:border-indigo-500 text-slate-800 hover:bg-indigo-50/50';
                            if (isAnswerSubmitted) {
                              if (idx === q.correctIndex) {
                                optionStyles = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold ring-2 ring-emerald-400/50';
                              } else if (idx === selectedAnswerIndex) {
                                optionStyles = 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-400/50';
                              } else {
                                optionStyles = 'bg-slate-50 border-slate-200 text-slate-400 opacity-50';
                              }
                            }

                            return (
                              <button
                                key={idx}
                                id={`exam-opt-${idx}`}
                                onClick={() => handleSelectAnswer(idx)}
                                disabled={isAnswerSubmitted}
                                className={`p-4 rounded-2xl border text-sm text-right transition-all flex items-center justify-between gap-3 shadow-2xs font-medium cursor-pointer ${optionStyles}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                                    {idx + 1}
                                  </div>
                                  <span>{option}</span>
                                </div>

                                {isAnswerSubmitted && idx === q.correctIndex && (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                )}
                                {isAnswerSubmitted && idx === selectedAnswerIndex && idx !== q.correctIndex && (
                                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation Box */}
                        {isAnswerSubmitted && (
                          <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-5 space-y-3 animate-in fade-in duration-200 shadow-2xs">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                              <Sparkles className="w-4 h-4 text-indigo-600" />
                              <span>تحلیل و توضیح علمی پاسخ:</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                              {q.explanation}
                            </p>

                            <div className="pt-2 flex justify-end">
                              <button
                                id="exam-next-btn"
                                onClick={handleNextQuestion}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
                              >
                                <span>{currentQuestionIndex + 1 === currentQuestions.length ? 'مشاهده نتیجه نهایی آزمون' : 'سوال بعدی'}</span>
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              ) : (
                /* EXAM RESULTS / CERTIFICATE CARD */
                <div className="text-center py-6 space-y-6 relative z-10">
                  {(() => {
                    const totalQ = currentQuestions.length;
                    const scorePercent = Math.round((examCorrectCount / totalQ) * 100);
                    const isPassed = scorePercent >= selectedStage.passingScorePercent;

                    return (
                      <>
                        <div className="inline-flex p-4 rounded-3xl bg-indigo-50 border border-indigo-200 shadow-xs">
                          {isPassed ? (
                            <Trophy className="w-16 h-16 text-amber-500 animate-bounce" />
                          ) : (
                            <AlertCircle className="w-16 h-16 text-rose-500" />
                          )}
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                            {isPassed ? 'تبریک! شما این مرحله را با موفقیت گذراندید' : 'نیاز به تمرین و مرور بیشتر'}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                            {isPassed
                              ? `شما با کسب نمره ${scorePercent}٪، مرحله ${selectedStage.stepNumber} را با موفقیت پاس کردید و قفل مرحله بعد برای شما باز شد!`
                              : `شما ${examCorrectCount} پاسخ درست از ${totalQ} سوال کسب کردید (${scorePercent}٪). حداقل نمره قبولی ${selectedStage.passingScorePercent}٪ است.`}
                          </p>
                        </div>

                        {/* Reward Badges */}
                        {isPassed && (
                          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl max-w-md mx-auto space-y-2 shadow-2xs">
                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-900">
                              <Award className="w-4 h-4 text-amber-600" />
                              <span>جوایز و نشان‌های آزاد شده:</span>
                            </div>
                            <div className="text-sm font-black text-amber-950">{selectedStage.badgeName}</div>
                            <div className="text-xs text-amber-800 font-medium">+{selectedStage.xpReward} امتیاز مهارت به حساب شما افزوده شد!</div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                          <button
                            id="exam-retake-btn"
                            onClick={handleStartExam}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-full text-xs sm:text-sm transition-all border border-slate-200 flex items-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>شرکت دوباره در آزمون</span>
                          </button>

                          <button
                            id="exam-back-to-roadmap-btn"
                            onClick={() => setIsTakingExam(false)}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
                          >
                            <span>بازگشت به نقشه راه</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
