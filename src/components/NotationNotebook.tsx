import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Edit3,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Award,
  RotateCcw,
  RotateCw,
  Trash2,
  Printer,
  ChevronRight,
  ChevronLeft,
  Flame,
  Bot,
  HelpCircle,
  Eye,
  Download,
  Paintbrush,
  Eraser,
  Undo2,
  Send,
  FileImage,
  Layers,
  Info,
  Lightbulb,
  Trophy,
  Check,
  X
} from 'lucide-react';
import {
  NotebookAssignment,
  NotebookReviewResult,
  InstrumentTimbre,
  AppTab
} from '../types';
import { HANDWRITING_RULES, NOTEBOOK_ASSIGNMENTS } from '../data/notebookData';
import { audioEngine } from '../utils/audioEngine';
import confetti from 'canvas-confetti';

interface NotationNotebookProps {
  currentTimbre: InstrumentTimbre;
  onUpdateScore: (points: number) => void;
  onNavigateTab: (tab: AppTab) => void;
  onAskMaestro: (prompt: string) => void;
}

export const NotationNotebook: React.FC<NotationNotebookProps> = ({
  currentTimbre,
  onUpdateScore,
  onNavigateTab,
  onAskMaestro,
}) => {
  // Main Sub-Tab navigation
  const [activeSubTab, setActiveSubTab] = useState<'masterclass' | 'assignments' | 'studio'>('assignments');
  
  // Selected lesson / assignment
  const [selectedRuleId, setSelectedRuleId] = useState<string>('rule-g-clef');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('task-1');

  // Interactive 3rd line rule demonstration state
  const [demoNotePitch, setDemoNotePitch] = useState<number>(2); // 0=E4, 1=F4, 2=G4, 3=A4, 4=B4 (3rd line), 5=C5, 6=D5, 7=E5, 8=F5

  // Submission Mode: 'upload' or 'canvas'
  const [inputMode, setInputMode] = useState<'upload' | 'canvas'>('canvas');

  // Upload Photo State
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [userNotesText, setUserNotesText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Digital Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [penColor, setPenColor] = useState<string>('#1E1B4B'); // deep indigo / ink
  const [penWidth, setPenWidth] = useState<number>(3);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([]);

  // AI Review State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [reviewResult, setReviewResult] = useState<NotebookReviewResult | null>(null);
  const [isPlayingDetectedNotes, setIsPlayingDetectedNotes] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Print Manuscript Modal
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  const selectedRule = HANDWRITING_RULES.find((r) => r.id === selectedRuleId) || HANDWRITING_RULES[0];
  const selectedAssignment = NOTEBOOK_ASSIGNMENTS.find((a) => a.id === selectedAssignmentId) || NOTEBOOK_ASSIGNMENTS[0];

  // Initialize Canvas with 5 Staff Lines
  useEffect(() => {
    if (inputMode === 'canvas') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw initial clean staff lines
      drawStaffBackground(ctx, canvas.width, canvas.height);
      // Save initial state
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setCanvasHistory([initialData]);
    }
  }, [inputMode]);

  const drawStaffBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Fill soft parchment background
    ctx.fillStyle = '#FAFAF9';
    ctx.fillRect(0, 0, width, height);

    // Draw top & bottom margin borders
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // 5-line staff setup
    const staffTop = height * 0.35;
    const lineSpacing = 24;
    const staffLeft = 40;
    const staffRight = width - 40;

    // Draw 5 Staff lines
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(staffLeft, y);
      ctx.lineTo(staffRight, y);
      ctx.stroke();

      // Line number labels on the right
      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px Vazirmatn, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`خط ${5 - i}`, staffLeft - 8, y + 3);
    }

    // Light subtle guide lines for ledger lines above and below
    ctx.strokeStyle = '#E2E8F0';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    // Lower ledger (C4)
    ctx.beginPath();
    ctx.moveTo(staffLeft, staffTop + 5 * lineSpacing);
    ctx.lineTo(staffRight, staffTop + 5 * lineSpacing);
    ctx.stroke();
    // Upper ledger (A5)
    ctx.beginPath();
    ctx.moveTo(staffLeft, staffTop - 1 * lineSpacing);
    ctx.lineTo(staffRight, staffTop - 1 * lineSpacing);
    ctx.stroke();
    ctx.setLineDash([]); // reset

    // Watermark text in bottom left
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '11px Vazirmatn, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('دفتر نت‌نویسی امیتیس - پنج خط استاندارد', 20, height - 16);
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#FAFAF9' : penColor;
    ctx.lineWidth = isEraser ? penWidth * 4 : penWidth;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    // Save history for Undo
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setCanvasHistory((prev) => [...prev.slice(-15), currentData]);
  };

  const handleCanvasUndo = () => {
    if (canvasHistory.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...canvasHistory];
    newHistory.pop(); // remove current
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setCanvasHistory(newHistory);
  };

  const handleCanvasClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawStaffBackground(ctx, canvas.width, canvas.height);
    const cleared = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setCanvasHistory([cleared]);
  };

  // Stamp helper for Stamp-based assistance (e.g. quick Treble Clef stamp)
  const stampTrebleClef = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1E1B4B';
    ctx.font = '72px serif';
    ctx.fillText('𝄞', 60, canvas.height * 0.35 + 3.8 * 24);

    const stamped = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setCanvasHistory((prev) => [...prev, stamped]);
  };

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('لطفاً یک فایل تصویری (JPG, PNG) انتخاب کنید.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImageBase64(event.target?.result as string);
      setImageRotation(0);
      setReviewResult(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const rotateUploadedImage = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  // Submit to AI Vision Evaluator
  const handleSubmitForAiReview = async () => {
    let imagePayload = '';

    if (inputMode === 'canvas') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      imagePayload = canvas.toDataURL('image/jpeg', 0.9);
    } else {
      if (!uploadedImageBase64) {
        alert('لطفاً ابتدا یک عکس از دفتر نت خود آپلود کنید.');
        return;
      }
      imagePayload = uploadedImageBase64;
    }

    setIsAnalyzing(true);
    setReviewResult(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/gemini/handwriting-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePayload,
          mimeType: 'image/jpeg',
          assignmentTitle: selectedAssignment.title,
          expectedNotes: selectedAssignment.targetNotes,
          assignmentRules: selectedAssignment.rulesToCheck,
          userNotesText: userNotesText,
        }),
      });

      if (!res.ok) {
        throw new Error('خطا در دریافت پاسخ از سرور هوش مصنوعی');
      }

      const data: NotebookReviewResult = await res.json();
      setReviewResult(data);

      if (data.passed) {
        onUpdateScore(selectedAssignment.xpReward);
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('متأسفانه بررسی هوشمند موقتاً با خطا مواجه شد. لطفاً تصویر با کیفیت‌تری انتخاب کرده و دوباره امتحان کنید.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Play detected notes from AI Review
  const playDetectedNotes = async () => {
    if (!reviewResult?.detectedNotes || reviewResult.detectedNotes.length === 0 || isPlayingDetectedNotes) return;
    setIsPlayingDetectedNotes(true);

    for (const note of reviewResult.detectedNotes) {
      audioEngine.playNote(note, currentTimbre, 0.45);
      await new Promise((r) => setTimeout(r, 360));
    }
    setIsPlayingDetectedNotes(false);
  };

  // 3rd Line Demo Note Labels
  const DEMO_PITCHES = [
    { name: 'E4', farsi: 'می (خط ۱)', line: 1, pos: 'زیر خط ۳', stemDir: 'up', stemSide: 'right' },
    { name: 'F4', farsi: 'فا (فضای ۱)', line: 1.5, pos: 'زیر خط ۳', stemDir: 'up', stemSide: 'right' },
    { name: 'G4', farsi: 'سل (خط ۲)', line: 2, pos: 'زیر خط ۳', stemDir: 'up', stemSide: 'right' },
    { name: 'A4', farsi: 'لا (فضای ۲)', line: 2.5, pos: 'زیر خط ۳', stemDir: 'up', stemSide: 'right' },
    { name: 'B4', farsi: 'سی (خط ۳ - خط مرز)', line: 3, pos: 'روی خط ۳', stemDir: 'down', stemSide: 'left' },
    { name: 'C5', farsi: 'دو (فضای ۳)', line: 3.5, pos: 'بالای خط ۳', stemDir: 'down', stemSide: 'left' },
    { name: 'D5', farsi: 'ر (خط ۴)', line: 4, pos: 'بالای خط ۳', stemDir: 'down', stemSide: 'left' },
    { name: 'E5', farsi: 'می (فضای ۴)', line: 4.5, pos: 'بالای خط ۳', stemDir: 'down', stemSide: 'left' },
    { name: 'F5', farsi: 'فا (خط ۵)', line: 5, pos: 'بالای خط ۳', stemDir: 'down', stemSide: 'left' },
  ];

  const currentDemoPitch = DEMO_PITCHES[demoNotePitch];

  const handlePrintStandardManuscript = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Intro */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-artistic-grid opacity-20 pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black text-xs rounded-full border border-indigo-200 flex items-center gap-1.5 shadow-2xs">
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>کارگاه خوش‌نویسی و دفتر مشق موسیقی امیتیس</span>
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-200">
                مجهز به بینایی ماشین هوش مصنوعی (Vision AI)
              </span>
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">
              دفتر نت‌نویسی، تمرین دست‌خط و تصحیح هوشمند
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              اصول خوش‌نویسی و استانداردهای جهانی نگارش نت را بیاموزید؛ سپس در <strong>دفترچه نت فیزیکی خود</strong> یا در <strong>تخته دیجیتال برنامه</strong> نت‌ها را بنویسید. هوش مصنوعی امیتیس تصویر دست‌خط شما را دقیقاً بررسی، اشتباهات را مشخص، و نت‌های نوشته شده را برایتان می‌نوازد!
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="print-sheet-paper-btn"
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-full text-xs transition-all border border-slate-200 flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>چاپ برگه ۵ خط نت خام (A4)</span>
            </button>

            <button
              id="goto-studio-tab-btn"
              onClick={() => {
                setActiveSubTab('studio');
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>ارسال عکس دفتر و تصحیح</span>
            </button>
          </div>
        </div>

        {/* 3 Main Navigation Tabs */}
        <div className="pt-6 border-t border-slate-200/80 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          <button
            id="subtab-assignments"
            onClick={() => setActiveSubTab('assignments')}
            className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs ${
              activeSubTab === 'assignments'
                ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 ring-2 ring-indigo-400/30 font-black shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                activeSubTab === 'assignments' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                ✍️
              </div>
              <div>
                <div className="text-xs font-bold">تکالیف و مشق‌های دفتر</div>
                <div className="text-[10px] text-slate-500 font-medium">۶ ماموریت دست‌نویسی سطح‌بندی شده</div>
              </div>
            </div>
            {activeSubTab === 'assignments' && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
          </button>

          <button
            id="subtab-masterclass"
            onClick={() => setActiveSubTab('masterclass')}
            className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs ${
              activeSubTab === 'masterclass'
                ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 ring-2 ring-indigo-400/30 font-black shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                activeSubTab === 'masterclass' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                📘
              </div>
              <div>
                <div className="text-xs font-bold">اصول و قوانین خوش‌نویسی نت</div>
                <div className="text-[10px] text-slate-500 font-medium">کلیدها، سر نت‌ها، پایه‌ها و سکوت‌ها</div>
              </div>
            </div>
            {activeSubTab === 'masterclass' && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
          </button>

          <button
            id="subtab-studio"
            onClick={() => setActiveSubTab('studio')}
            className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs ${
              activeSubTab === 'studio'
                ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 ring-2 ring-indigo-400/30 font-black shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                activeSubTab === 'studio' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                🤖
              </div>
              <div>
                <div className="text-xs font-bold">تخته دیجیتال و تصحیح هوش مصنوعی</div>
                <div className="text-[10px] text-slate-500 font-medium">آپلود عکس یا رسم روی ۵ خط</div>
              </div>
            </div>
            {activeSubTab === 'studio' && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
          </button>
        </div>
      </div>

      {/* 2. SECTION A: ASSIGNMENTS & HOMEWORK (مشق‌های دفترچه نت) */}
      {activeSubTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List of 6 Homework Assignments */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold text-slate-600 px-1">
              انتخاب تکلیف برای نوشتن در دفتر:
            </div>

            <div className="space-y-2.5">
              {NOTEBOOK_ASSIGNMENTS.map((assignment, index) => {
                const isSelected = selectedAssignment.id === assignment.id;
                return (
                  <button
                    key={assignment.id}
                    id={`assignment-card-${assignment.id}`}
                    onClick={() => setSelectedAssignmentId(assignment.id)}
                    className={`w-full text-right p-4 rounded-2xl border transition-all flex flex-col gap-2.5 cursor-pointer shadow-2xs relative ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 ring-2 ring-indigo-400/40 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="font-bold text-xs sm:text-sm">{assignment.title}</span>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        assignment.level === 'مبتدی'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : assignment.level === 'متوسط'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {assignment.level}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                      {assignment.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-semibold pt-1 border-t border-slate-200/70">
                      <span className="text-amber-600 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>+{assignment.xpReward} امتیاز مهارت</span>
                      </span>
                      <span className="text-slate-400 font-latin text-[10px]">{assignment.badge}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Assignment Briefing & Guide */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
              {/* Assignment Title Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-0.5 rounded-full font-bold">
                      تکلیف انتخابی
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      سطح: {selectedAssignment.level}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    {selectedAssignment.title}
                  </h3>
                </div>

                <button
                  onClick={() => {
                    setActiveSubTab('studio');
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 cursor-pointer transition-all"
                >
                  <span>نوشتن و ارسال این مشق</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Assignment Instructions */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>صورت تکلیف و نحوه نوشتن در دفترچه نت:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {selectedAssignment.description}
                </p>
              </div>

              {/* Target Notes & Expected Structure */}
              <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>ترتیب نت‌ها و المان‌های مورد انتظار:</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-indigo-200/80 font-mono text-xs sm:text-sm text-indigo-950 font-bold text-center dir-ltr">
                  {selectedAssignment.sampleVisualText}
                </div>

                {selectedAssignment.targetNotes.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-indigo-800 font-bold">شنیدن نمونه صوتی نت‌ها:</span>
                    <button
                      onClick={async () => {
                        for (const note of selectedAssignment.targetNotes) {
                          audioEngine.playNote(note, currentTimbre, 0.4);
                          await new Promise((r) => setTimeout(r, 280));
                        }
                      }}
                      className="px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>پخش ملودی هدف</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Golden Rules Checklist */}
              <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>قوانینی که هوش مصنوعی در بررسی تصویر شما چک می‌کند:</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-medium">
                  {selectedAssignment.rulesToCheck}
                </p>
              </div>

              {/* Call to action */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-medium">
                  می‌توانید روی دفتر نت فیزیکی خود بنویسید یا از تخته دیجیتال برنامه استفاده کنید.
                </div>
                <button
                  onClick={() => {
                    setActiveSubTab('masterclass');
                    setSelectedRuleId('rule-stem-direction');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>مرور قانون جهت پایه‌ها و خوش‌نویسی</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECTION B: HANDWRITING MASTERCLASS (کلاس آموزش خوش‌نویسی نت) */}
      {activeSubTab === 'masterclass' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Rules List (Left Sidebar) */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="text-xs font-bold text-slate-600 px-1 mb-1">
              فصل‌های خوش‌نویسی و استانداردهای نت:
            </div>

            {HANDWRITING_RULES.map((rule, idx) => {
              const isSelected = selectedRule.id === rule.id;
              return (
                <button
                  key={rule.id}
                  id={`rule-tab-${rule.id}`}
                  onClick={() => setSelectedRuleId(rule.id)}
                  className={`w-full text-right p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-500 text-indigo-950 ring-2 ring-indigo-400/40 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm line-clamp-1">{rule.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 font-medium">{rule.category}</div>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Active Lesson View (Main) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
              {/* Header */}
              <div className="pb-4 border-b border-slate-200 space-y-1">
                <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold border border-indigo-200">
                  {selectedRule.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {selectedRule.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {selectedRule.shortDesc}
                </p>
              </div>

              {/* Interactive Visual Sandbox for 3rd line rule or G-Clef */}
              {selectedRule.illustrationType === 'stem_rule' && (
                <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="text-xs font-bold flex items-center gap-2 text-indigo-300">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>شبیه‌ساز تعاملی قانون خط سوم: موقعیت نت را تغییر دهید</span>
                    </div>
                    <span className="text-xs text-amber-300 font-bold bg-amber-500/20 px-3 py-0.5 rounded-full border border-amber-400/30">
                      وضعیت: {currentDemoPitch.pos}
                    </span>
                  </div>

                  {/* Interactive Staff Sandbox */}
                  <div className="relative py-6 px-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-center min-h-[160px]">
                    {/* 5 Lines */}
                    <div className="w-full max-w-md relative h-28 flex flex-col justify-between py-2">
                      <div className="w-full h-0.5 bg-slate-600"></div>
                      <div className="w-full h-0.5 bg-slate-600"></div>
                      <div className="w-full h-1 bg-amber-400/80 relative">
                        <span className="absolute -right-16 -top-2.5 text-[10px] text-amber-300 font-bold">خط ۳ (مرز)</span>
                      </div>
                      <div className="w-full h-0.5 bg-slate-600"></div>
                      <div className="w-full h-0.5 bg-slate-600"></div>

                      {/* Moving Note with Dynamic Stem */}
                      <div
                        className="absolute transition-all duration-300 left-1/2 -translate-x-1/2 flex items-center"
                        style={{
                          bottom: `${demoNotePitch * 11}px`,
                        }}
                      >
                        {/* If Stem Down (Left) */}
                        {currentDemoPitch.stemDir === 'down' ? (
                          <div className="relative flex items-start">
                            {/* Stem line going down on left */}
                            <div className="w-1 h-14 bg-indigo-400 -mr-0.5 rounded-full"></div>
                            {/* Notehead oval */}
                            <div className="w-5 h-3.5 bg-indigo-300 rounded-full rotate-[-25deg] shadow-lg shadow-indigo-500/50"></div>
                          </div>
                        ) : (
                          <div className="relative flex items-end">
                            {/* Notehead oval */}
                            <div className="w-5 h-3.5 bg-indigo-300 rounded-full rotate-[-25deg] shadow-lg shadow-indigo-500/50"></div>
                            {/* Stem line going up on right */}
                            <div className="w-1 h-14 bg-indigo-400 -ml-0.5 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Slider Control */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                      <span>نت فعلی: <strong className="text-white font-latin">{currentDemoPitch.name}</strong> ({currentDemoPitch.farsi})</span>
                      <span className="text-indigo-300">پایه نت: {currentDemoPitch.stemDir === 'up' ? 'رو به بالا (سمت راست)' : 'رو به پایین (سمت چپ)'}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      value={demoNotePitch}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDemoNotePitch(val);
                        audioEngine.playNote(DEMO_PITCHES[val].name, currentTimbre, 0.3);
                      }}
                      className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-full"
                    />
                  </div>
                </div>
              )}

              {/* Step by step drawing guide */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>مراحل گام‌به‌گام رسم با مداد یا خودکار:</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
                  {selectedRule.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Golden Rule Callout */}
              <div className="bg-indigo-50/80 p-5 rounded-2xl border border-indigo-200 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <Lightbulb className="w-4 h-4 text-indigo-600" />
                  <span>قانون طلایی که نباید فراموش کنید:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
                  {selectedRule.goldenRule}
                </p>
              </div>

              {/* Common Mistakes & Pro Tip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                    <X className="w-4 h-4 text-rose-600" />
                    <span>اشتباهات رایج نوآموزان:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-rose-950 font-medium">
                    {selectedRule.commonMistakes.map((mistake, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>توصیه خوش‌نویسی استاد امیتیس:</span>
                  </div>
                  <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                    {selectedRule.proCalligraphyTip}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SECTION C: SUBMISSION STUDIO & AI VISION CHECKER (تخته دیجیتال و تصحیح هوش مصنوعی) */}
      {activeSubTab === 'studio' && (
        <div className="space-y-6">
          {/* Active Homework Card Header */}
          <div className="bg-indigo-900 text-white rounded-3xl p-5 sm:p-7 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">
                  تکلیف فعال: {selectedAssignment.title}
                </span>
                <span className="text-xs text-indigo-200 font-medium">
                  جایزه: +{selectedAssignment.xpReward} امتیاز
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-100 font-medium">
                {selectedAssignment.description}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center bg-indigo-950/80 p-1.5 rounded-full border border-indigo-800 shrink-0">
              <button
                id="mode-canvas-btn"
                onClick={() => setInputMode('canvas')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  inputMode === 'canvas'
                    ? 'bg-white text-indigo-950 shadow-sm'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                <span>تخته دیجیتال ۵ خط</span>
              </button>

              <button
                id="mode-upload-btn"
                onClick={() => setInputMode('upload')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  inputMode === 'upload'
                    ? 'bg-white text-indigo-950 shadow-sm'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>آپلود عکس از دفتر واقعی</span>
              </button>
            </div>
          </div>

          {/* Interactive Workspace (Canvas or Photo Upload) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Arena (Left / Main) */}
            <div className="lg:col-span-7 space-y-4">
              {inputMode === 'canvas' ? (
                /* DIGITAL 5-LINE CANVAS */
                <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 sm:p-6 shadow-sm space-y-4">
                  {/* Canvas Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    {/* Pen & Eraser tools */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEraser(false)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          !isEraser
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="قلم جوهر"
                      >
                        <Paintbrush className="w-4 h-4" />
                        <span className="hidden sm:inline">قلم</span>
                      </button>

                      <button
                        onClick={() => setIsEraser(true)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isEraser
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="پاک‌کن"
                      >
                        <Eraser className="w-4 h-4" />
                        <span className="hidden sm:inline">پاک‌کن</span>
                      </button>

                      {/* Pen Width */}
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                        <span className="text-slate-500 font-medium">ضخامت:</span>
                        <select
                          value={penWidth}
                          onChange={(e) => setPenWidth(Number(e.target.value))}
                          className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                        >
                          <option value="2">نازک (2px)</option>
                          <option value="3">استاندارد (3px)</option>
                          <option value="5">درشت / سرنت (5px)</option>
                        </select>
                      </div>

                      {/* Stamp Treble Clef Helper */}
                      <button
                        onClick={stampTrebleClef}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center gap-1 cursor-pointer"
                        title="مهر کلید سل آماده"
                      >
                        <span className="text-base leading-none">𝄞</span>
                        <span>مهر کلید</span>
                      </button>
                    </div>

                    {/* Undo & Clear */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCanvasUndo}
                        disabled={canvasHistory.length <= 1}
                        className="p-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all disabled:opacity-40 cursor-pointer"
                        title="برگرداندن حرکت قبلی (Undo)"
                      >
                        <Undo2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={handleCanvasClear}
                        className="p-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                        title="پاک کردن کل صفحه"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* HTML5 Canvas Surface */}
                  <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner bg-[#FAFAF9] flex justify-center">
                    <canvas
                      ref={canvasRef}
                      width={680}
                      height={320}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-auto max-w-full cursor-crosshair touch-none select-none"
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>💡 با ماوس، قلم نوری یا لمس انگشت روی خطوط حامل بنویسید.</span>
                    <span>خط دوم = سل | خط سوم = سی</span>
                  </div>
                </div>
              ) : (
                /* PHOTO UPLOAD CONTAINER */
                <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      آپلود یا گرفتن عکس از صفحه دفترچه نت شما:
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      عکس باید واضح و با نور کافی باشد تا هوش مصنوعی خطوط و پایه‌ها را به دقت تشخیص دهد.
                    </p>
                  </div>

                  {!uploadedImageBase64 ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/80 transition-all rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3 cursor-pointer group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-indigo-900 block">
                          برای انتخاب یا کشیدن عکس دفتر کلیک کنید
                        </span>
                        <span className="text-xs text-slate-500 mt-1 block">
                          پشتیبانی از فایل‌های JPG و PNG یا عکس مستقیم دوربین گوشی
                        </span>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[360px]">
                        <img
                          src={uploadedImageBase64}
                          alt="Uploaded sheet music"
                          style={{ transform: `rotate(${imageRotation}deg)` }}
                          className="max-h-[340px] w-auto object-contain transition-transform duration-200"
                        />
                      </div>

                      {/* Photo controls */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={rotateUploadedImage}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>چرخش عکس (۹۰ درجه)</span>
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setUploadedImageBase64(null);
                            setReviewResult(null);
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>انتخاب عکس دیگر</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Optional user note text */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  توضیح اختیاری برای استاد هوش مصنوعی (مثلاً: «من نت‌های خطوط ۱ تا ۳ را نوشته‌ام»):
                </label>
                <input
                  type="text"
                  value={userNotesText}
                  onChange={(e) => setUserNotesText(e.target.value)}
                  placeholder="اگر نکته خاصی در مورد دست‌خطتان هست بنویسید..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Submit CTA Button */}
              <button
                id="submit-ai-vision-btn"
                onClick={handleSubmitForAiReview}
                disabled={isAnalyzing}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm sm:text-base transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>استاد هوش مصنوعی در حال اسکن و تحلیل خوش‌نویسی شماست...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>ارسال مشق به هوش مصنوعی برای تصحیح و نمره‌دهی</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Review Result & Scorecard (Right Sidebar) */}
            <div className="lg:col-span-5 space-y-4">
              {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {isAnalyzing && (
                <div className="bg-white border border-indigo-200 rounded-[28px] p-8 text-center space-y-4 shadow-sm animate-pulse">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                    <Bot className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900">در حال تحلیل دست‌خط نت‌ها...</h4>
                    <p className="text-xs text-slate-500">
                      بررسی موقعیت کلید سل، زاویه بیضی سر نت‌ها و قانون جهت پایه‌ها
                    </p>
                  </div>
                </div>
              )}

              {reviewResult && !isAnalyzing && (
                /* AI RESULT CARD */
                <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
                  {/* Score Header */}
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200">
                    <div className="space-y-0.5">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                        reviewResult.passed
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {reviewResult.passed ? 'تکلیف با موفقیت تایید شد ✓' : 'نیاز به اصلاح جزئی'}
                      </span>
                      <h4 className="text-base font-black text-slate-900">
                        کارنامه خوش‌نویسی هوش مصنوعی
                      </h4>
                    </div>

                    {/* Big Score Circle */}
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black text-lg shadow-sm border ${
                      reviewResult.score >= 80
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : reviewResult.score >= 60
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-rose-500 text-white border-rose-600'
                    }`}>
                      <span>{reviewResult.score}</span>
                      <span className="text-[9px] font-medium -mt-1">از ۱۰۰</span>
                    </div>
                  </div>

                  {/* Verdict Text */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    {reviewResult.overallVerdict}
                  </p>

                  {/* Detected Notes & Audio Playback */}
                  {reviewResult.detectedNotes && reviewResult.detectedNotes.length > 0 && (
                    <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-200 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-indigo-600" />
                          <span>نت‌های شناسایی شده در دست‌خط شما:</span>
                        </span>

                        <button
                          onClick={playDetectedNotes}
                          disabled={isPlayingDetectedNotes}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${isPlayingDetectedNotes ? 'animate-bounce' : ''}`} />
                          <span>{isPlayingDetectedNotes ? 'در حال پخش...' : 'شنیدن صدای نت‌ها'}</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {reviewResult.detectedNotes.map((n, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-white text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold font-latin shadow-2xs"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths List */}
                  {reviewResult.strengths && reviewResult.strengths.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>نقاط قوت دست‌خط شما:</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                        {reviewResult.strengths.map((str, i) => (
                          <li key={i} className="flex items-start gap-1.5 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Errors & Corrections */}
                  {reviewResult.errors && reviewResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>اشکالات نیازمند اصلاح:</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-rose-950 font-medium">
                        {reviewResult.errors.map((err, i) => (
                          <li key={i} className="flex items-start gap-1.5 bg-rose-50/60 p-2 rounded-xl border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                            <span>{err}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Master's Tip */}
                  {reviewResult.calligraphyTip && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>توصیه خوش‌نویسی استاد امیتیس:</span>
                      </div>
                      <p className="text-amber-950 font-medium leading-relaxed">
                        {reviewResult.calligraphyTip}
                      </p>
                    </div>
                  )}

                  {/* Consult AI Maestro Link */}
                  <div className="pt-2">
                    <button
                      onClick={() => onAskMaestro(`استاد، هوش مصنوعی در تصحیح دست‌خط نت‌نویسی من گفت: «${reviewResult.corrections.join(' - ') || reviewResult.overallVerdict}». لطفاً این موضوع را بیشتر برایم توضیح دهید.`)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5 text-indigo-600" />
                      <span>پرسش و مشاوره بیشتر با استاد هوشمند امیتیس...</span>
                    </button>
                  </div>
                </div>
              )}

              {!reviewResult && !isAnalyzing && (
                /* EMPTY STATE / TIP */
                <div className="bg-slate-50 border border-slate-200/80 rounded-[28px] p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">آماده دریافت مشق شما</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    پس از کشیدن نت‌ها در تخته دیجیتال یا آپلود عکس از دفتر نت خود، دکمه ارسال را بزنید تا نمره، نقاط قوت و اشکالات دقیق به صورت لحظه‌ای برایتان نمایش یابد.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. PRINTABLE MANUSCRIPT MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  چاپ و دانلود برگه ۵ خط نت خام (A4 استاندارد)
                </h3>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              شما می‌توانید این برگه استاندارد حامل ۵ خط را مستقیماً پرینت بگیرید تا در خانه روی کاغذ استاندارد مشق‌های خود را بنویسید و عکس آن را برای هوش مصنوعی آپلود کنید.
            </p>

            {/* Printable Preview Sheet */}
            <div className="p-6 bg-slate-50 border border-slate-300 rounded-2xl space-y-6 select-none font-sans">
              <div className="flex justify-between items-center text-xs text-slate-600 border-b border-slate-300 pb-2">
                <span className="font-bold">نام هنرجو: ..............................</span>
                <span className="font-bold">تاریخ: .... / .... / ۱۴۰...</span>
                <span className="font-black font-latin text-indigo-600">EMITIS MUSIC</span>
              </div>

              {/* 5 Staff line sets */}
              {[1, 2, 3, 4, 5].map((staffNum) => (
                <div key={staffNum} className="relative py-2">
                  <div className="w-full h-16 flex flex-col justify-between border-r-2 border-l-2 border-slate-800 py-1 px-1">
                    <div className="w-full h-0.5 bg-slate-800"></div>
                    <div className="w-full h-0.5 bg-slate-800"></div>
                    <div className="w-full h-0.5 bg-slate-800"></div>
                    <div className="w-full h-0.5 bg-slate-800"></div>
                    <div className="w-full h-0.5 bg-slate-800"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-xs cursor-pointer"
              >
                بستن
              </button>
              <button
                onClick={handlePrintStandardManuscript}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>ارسال به پرینتر (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
