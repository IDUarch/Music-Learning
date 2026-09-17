import React from 'react';
import { 
  Music, 
  BookOpen, 
  Piano, 
  Eye, 
  Headphones, 
  Compass, 
  Timer, 
  Sparkles, 
  Search, 
  Volume2, 
  VolumeX, 
  Flame, 
  Guitar,
  Award,
  Milestone,
  Edit3
} from 'lucide-react';
import { NavigationTab, InstrumentTimbre } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface HeaderProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  currentTimbre: InstrumentTimbre;
  onChangeTimbre: (timbre: InstrumentTimbre) => void;
  streakDays: number;
  totalScore: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentTimbre,
  onChangeTimbre,
  streakDays,
  totalScore,
}) => {
  const [isMuted, setIsMuted] = React.useState(false);
  const [volume, setVolume] = React.useState(75);

  const handleMuteToggle = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    audioEngine.setVolume(val / 100);
  };

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'roadmap', label: 'نقشه راه و آزمون مراحل', icon: <Milestone className="w-4 h-4 text-indigo-600" />, badge: 'آزمون‌محور' },
    { id: 'notation-notebook', label: 'دفتر نت‌نویسی و تصحیح عکس', icon: <Edit3 className="w-4 h-4 text-emerald-600" />, badge: 'هوشمند' },
    { id: 'piano', label: 'پیانوی هوشمند', icon: <Piano className="w-4 h-4" /> },
    { id: 'sight-reading', label: 'نت‌خوانی خطوط حامل', icon: <Eye className="w-4 h-4" /> },
    { id: 'ear-training', label: 'تربیت شنوایی و سلفژ', icon: <Headphones className="w-4 h-4" /> },
    { id: 'dastgah', label: 'دستگاه‌های ایرانی و گام‌ها', icon: <Compass className="w-4 h-4" /> },
    { id: 'learn', label: 'دوره‌ها و دروس جامع', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'fretboard', label: 'فرت‌بورد سازها', icon: <Guitar className="w-4 h-4" /> },
    { id: 'metronome', label: 'مترونوم و بازی ریتم', icon: <Timer className="w-4 h-4" /> },
    { id: 'ai-maestro', label: 'استاد هوشمند امیتیس', icon: <Sparkles className="w-4 h-4 text-amber-500" />, badge: 'AI' },
    { id: 'search-grounding', label: 'پژوهش و تاریخچه', icon: <Search className="w-4 h-4 text-sky-600" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => onSelectTab('piano')}
          className="flex items-center gap-3.5 cursor-pointer group"
          id="header-brand-logo"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 group-hover:bg-indigo-700 transition-all">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-latin text-2xl font-black tracking-tight uppercase italic text-indigo-600 group-hover:text-indigo-700 transition-colors">
                EMITIS
              </span>
              <span className="text-[11px] bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold border border-indigo-200">
                آکادمی موسیقی
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">سامانه جامع، شاد و تعاملی فراگیری موسیقی</p>
          </div>
        </div>

        {/* Quick Controls & Stats */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Instrument Timbre Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 px-3.5 py-1.5 rounded-full border border-slate-200 text-xs text-slate-700 hover:border-slate-300 transition-colors shadow-2xs">
            <span className="text-slate-500 font-medium hidden sm:inline">صدای ساز:</span>
            <select
              id="timbre-selector"
              value={currentTimbre}
              onChange={(e) => onChangeTimbre(e.target.value as InstrumentTimbre)}
              className="bg-transparent text-indigo-700 font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="piano">پیانو آکوستیک (Piano)</option>
              <option value="guitar">گیتار آکوستیک (Guitar)</option>
              <option value="flute">نی / فلوت (Flute/Ney)</option>
              <option value="harp">سنتور / هارپ (Harp/Santur)</option>
              <option value="synth">سینتی‌سایزر (Synth)</option>
            </select>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 bg-slate-100/90 px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
            <button
              onClick={handleMuteToggle}
              id="volume-mute-button"
              className="text-slate-600 hover:text-indigo-600 transition-colors"
              title={isMuted ? 'فعال کردن صدا' : 'بی‌صدا کردن'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-slate-700" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 accent-indigo-600 cursor-pointer h-1.5 bg-slate-300 rounded-full"
              title="میزان صدا"
            />
          </div>

          {/* Score & Streak */}
          <div className="flex items-center gap-2.5 bg-slate-100/90 px-3.5 py-1.5 rounded-full border border-slate-200 text-xs shadow-2xs">
            <div className="flex items-center gap-1.5 text-amber-600 font-bold" title="روزهای متوالی تمرین">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{streakDays} روز</span>
            </div>
            <div className="w-px h-3 bg-slate-300"></div>
            <div className="flex items-center gap-1.5 text-indigo-700 font-bold" title="امتیاز تمرین‌ها">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>{totalScore} امتیاز</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="max-w-7xl mx-auto px-2 sm:px-6 overflow-x-auto no-scrollbar border-t border-slate-200/80">
        <div className="flex items-center gap-1.5 py-2 min-w-max">
          {navItems.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap relative ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
