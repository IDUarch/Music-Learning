import React, { useState } from 'react';
import { 
  BookOpen, 
  Play, 
  CheckCircle2, 
  Clock, 
  Award, 
  ChevronLeft, 
  HelpCircle, 
  Sparkles, 
  Check, 
  Volume2 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lesson, InstrumentTimbre } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { CURRICULUM_LESSONS } from '../data/curriculum';

interface LessonsHubProps {
  currentTimbre: InstrumentTimbre;
  completedLessonIds: string[];
  onCompleteLesson: (lessonId: string, points: number) => void;
  onNavigateTab: (tab: any) => void;
}

export const LessonsHub: React.FC<LessonsHubProps> = ({
  currentTimbre,
  completedLessonIds,
  onCompleteLesson,
  onNavigateTab,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(CURRICULUM_LESSONS[0]);
  const [quizSelectedAnswer, setQuizSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const handlePlayNotes = (notes: string[]) => {
    audioEngine.playSequence(notes.map((n) => ({ name: n })), currentTimbre, 350);
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setQuizSelectedAnswer(null);
    setQuizSubmitted(false);
  };

  const handleQuizSubmit = (idx: number) => {
    if (quizSubmitted) return;
    setQuizSelectedAnswer(idx);
    setQuizSubmitted(true);

    if (idx === selectedLesson.quiz.correctIndex) {
      onCompleteLesson(selectedLesson.id, 50);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const isCompleted = completedLessonIds.includes(selectedLesson.id);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#131317] border border-white/10 rounded-[28px] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-500/15 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 font-medium">
                مسیر آموزشی آکادمی امیتیس
              </span>
              <span className="text-xs text-white/50">
                {completedLessonIds.length} از {CURRICULUM_LESSONS.length} درس تکمیل شده
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#F0F0F2] mt-2">
              دوره‌های جامع تئوری، ریتم و سازشناسی
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl">
              از پایه‌ای‌ترین اصول الفبای موسیقی تا هارمونی پیشرفته و ردیف دستگاهی موسیقی ایران همراه با مثال‌های صوتی تعاملی.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('piano')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5"
            >
              <span>تمرین روی پیانو</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Lessons Sidebar + Detail Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lessons List Column */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold text-white/50 px-1">سرفصل‌های آموزشی:</div>
          {CURRICULUM_LESSONS.map((lesson, idx) => {
            const isSelected = selectedLesson.id === lesson.id;
            const isLessonDone = completedLessonIds.includes(lesson.id);

            return (
              <button
                key={lesson.id}
                id={`lesson-card-${lesson.id}`}
                onClick={() => handleSelectLesson(lesson)}
                className={`w-full text-right p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40 text-white'
                    : 'bg-[#131317] border-white/10 hover:bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white/5 text-white/50 px-2.5 py-0.5 rounded-full font-mono">
                      درس {idx + 1}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-semibold">{lesson.level}</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#F0F0F2]">{lesson.title}</h4>
                  <p className="text-xs text-white/40 line-clamp-1">{lesson.subtitle}</p>
                </div>

                <div className="shrink-0 mt-1">
                  {isLessonDone ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-white/40 text-[11px]">
                      <Clock className="w-3 h-3" />
                      <span>{lesson.durationMinutes}د</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Lesson Interactive Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#131317] border border-white/10 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-artistic-grid opacity-20 pointer-events-none"></div>

            {/* Title Header */}
            <div className="border-b border-white/10 pb-4 relative z-10">
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold mb-1">
                <span>{selectedLesson.category}</span>
                <span>•</span>
                <span>سطح {selectedLesson.level}</span>
                <span>•</span>
                <span>مدت زمان: {selectedLesson.durationMinutes} دقیقه</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#F0F0F2]">
                {selectedLesson.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                {selectedLesson.subtitle}
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-[#0F0F12] p-4 rounded-2xl border border-white/10 text-xs sm:text-sm text-white/80 leading-relaxed relative z-10">
              {selectedLesson.content.summary}
            </div>

            {/* Sections */}
            <div className="space-y-6 relative z-10">
              {selectedLesson.content.sections.map((sec, sIdx) => (
                <div key={sIdx} className="bg-[#0F0F12] p-5 sm:p-6 rounded-2xl border border-white/10 space-y-3">
                  <h4 className="text-base font-bold text-indigo-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span>{sec.heading}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    {sec.text}
                  </p>

                  {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                    <ul className="space-y-2 pr-2">
                      {sec.bulletPoints.map((bp, bpIdx) => (
                        <li key={bpIdx} className="text-xs sm:text-sm text-white/70 flex items-start gap-2">
                          <span className="text-indigo-400 font-bold mt-0.5">•</span>
                          <span>{bp}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Playable Sound Example in Lesson */}
                  {sec.notesToPlay && sec.notesToPlay.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/5 p-3 rounded-xl">
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <Volume2 className="w-4 h-4 text-indigo-400" />
                        <span>{sec.exampleLabel || 'نمونه صوتی مرتبط با این بخش:'}</span>
                      </div>
                      <button
                        onClick={() => handlePlayNotes(sec.notesToPlay!)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>شنیدن نمونه نت‌ها</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* End of Lesson Interactive Quiz */}
            <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 relative z-10">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <span>آزمون سنجش پایان درس:</span>
                </div>
                {isCompleted && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تکمیل شده (+۵۰ امتیاز)</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm font-bold text-[#F0F0F2]">
                {selectedLesson.quiz.question}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedLesson.quiz.options.map((opt, oIdx) => {
                  let optStyle = 'bg-white/5 border-white/10 text-white/80 hover:border-indigo-500/50 hover:bg-white/10';
                  if (quizSubmitted) {
                    if (oIdx === selectedLesson.quiz.correctIndex) {
                      optStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                    } else if (oIdx === quizSelectedAnswer) {
                      optStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                    } else {
                      optStyle = 'bg-white/5 border-white/5 text-white/30 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      id={`lesson-quiz-opt-${oIdx}`}
                      onClick={() => handleQuizSubmit(oIdx)}
                      disabled={quizSubmitted}
                      className={`p-3.5 rounded-2xl border text-xs sm:text-sm text-right transition-all flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {quizSubmitted && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-xs sm:text-sm space-y-1 animate-in fade-in">
                  <div className={`font-bold ${quizSelectedAnswer === selectedLesson.quiz.correctIndex ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {quizSelectedAnswer === selectedLesson.quiz.correctIndex ? 'کاملاً درست است! 🎉' : 'نیاز به مرور مجدد دارد:'}
                  </div>
                  <p className="text-white/70 leading-relaxed">
                    {selectedLesson.quiz.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
