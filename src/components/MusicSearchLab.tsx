import React, { useState } from 'react';
import { 
  Search, 
  Globe, 
  ExternalLink, 
  BookOpen, 
  Sparkles, 
  History, 
  ShoppingBag, 
  Music, 
  UserCheck 
} from 'lucide-react';

export const MusicSearchLab: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const POPULAR_SEARCHES = [
    'تاریخچه و تبارشناسی ۷ دستگاه موسیقی ایرانی از دوره فارابی تا ردیف میرزاعبدالله',
    'زندگینامه و تاثیرات استاد محمدرضا شجریان و پرویز مشکاتیان در موسیقی اصیل',
    'راهنمای جامع خرید اولین پیانو دیجیتال (بررسی مدل‌های یاماها P45 و رولند FP-10)',
    'تفاوت مکانیزم تولید صدا در تار و سه‌تار و نحوه انتخاب چوب کاسه و صفحه',
    'تکامل هارمونی در دوره باروک، کلاسیک و رمانتیک (باخ، موتسارت، بتهوون و شوپن)',
  ];

  const handleSearch = async (searchTerm?: string) => {
    const q = (searchTerm || query).trim();
    if (!q || isLoading) return;

    if (searchTerm) setQuery(searchTerm);
    setIsLoading(true);
    setResult(null);
    setSources([]);

    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setResult(data.result || 'اطلاعاتی دریافت نشد.');
      setSources(data.sources || []);
    } catch (err) {
      console.error(err);
      setResult('خطا در جستجوی آنلاین منابع موسیقی.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#131317] border border-white/10 rounded-[28px] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#F0F0F2] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Search className="w-4 h-4" />
              </div>
              <span>مرکز پژوهش، تاریخچه و منابع آنلاین موسیقی (Google Search Grounding)</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/50 mt-1">
              دسترسی به مقالات مستند، بیوگرافی موسیقیدانان، راهنمای خرید ساز و تاریخ موسیقی با داده‌های زنده گوگل
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>مجهز به جستجوی وب Gemini</span>
            </span>
          </div>
        </div>

        {/* Search Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="pt-5 flex items-center gap-2.5 relative z-10"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute right-4 top-4" />
            <input
              type="text"
              id="music-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="مثال: تاریخچه دستگاه نوا، مقایسه پیانو دیجیتال، بیوگرافی شوپن، نحوه نگهداری از ساز..."
              disabled={isLoading}
              className="w-full bg-[#0F0F12] border border-white/10 focus:border-indigo-500 rounded-full pr-11 pl-4 py-3.5 text-xs sm:text-sm text-[#F0F0F2] placeholder-white/30 focus:outline-none shadow-inner"
            />
          </div>

          <button
            type="submit"
            id="music-search-btn"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>در حال پژوهش...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>جستجو و تحلیل</span>
              </>
            )}
          </button>
        </form>

        {/* Preset Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-4 relative z-10">
          <span className="text-xs text-white/40 shrink-0">موضوعات پرطرفدار:</span>
          {POPULAR_SEARCHES.map((topic, i) => (
            <button
              key={i}
              id={`popular-search-${i}`}
              onClick={() => handleSearch(topic)}
              className="text-xs bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded-full px-3.5 py-1.5 whitespace-nowrap transition-all"
            >
              {topic.slice(0, 45)}...
            </button>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="bg-[#131317] border border-white/10 rounded-[28px] p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in duration-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-artistic-grid opacity-20 pointer-events-none"></div>

          <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-[#F0F0F2]">نتایج پژوهش مستند</h3>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-white/80 leading-relaxed whitespace-pre-line font-sans relative z-10">
            {result}
          </div>

          {/* Web Sources & Citations */}
          {sources.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-3 relative z-10">
              <span className="text-xs font-bold text-white/60 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>منابع معتبر وب و پایگاه‌های استناد:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl bg-[#0F0F12] hover:bg-white/5 border border-white/10 hover:border-indigo-500/40 text-xs text-indigo-300 flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="truncate">{src.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-white/40 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
