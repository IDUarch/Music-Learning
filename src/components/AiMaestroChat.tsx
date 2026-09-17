import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Music, 
  Play, 
  Volume2, 
  Bot, 
  User, 
  Lightbulb, 
  CornerDownLeft, 
  Compass, 
  Check 
} from 'lucide-react';
import { ChatMessage, InstrumentTimbre } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface AiMaestroChatProps {
  currentTimbre: InstrumentTimbre;
  initialPrompt?: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    role: 'model',
    content: `درود بر شما هنرجوی گرامی! من **امیتیس**، مربی و استاد هوشمند موسیقی شما هستم. 🎵

من آماده‌ام تا در تمامی زمینه‌های زیر همراه و راهنمای شما باشم:
- **تئوری موسیقی غرب**: نت‌خوانی، فواصل، آکوردشناسی، هارمونی و کنترپوان
- **موسیقی اصیل ایرانی**: ۷ دستگاه (شور، ماهور، همایون، سه‌گاه، چهارگاه، نوا، راست‌پنج‌گاه)، آوازها، گوشه‌ها و ریزپرده‌های کُرُن و سُری
- **آموزش و تکنیک سازها**: پیانو، گیتار، تار، سه‌تار، ویولن، سنتور و ریتم
- **تربیت شنوایی (سلفژ و دیکته)**، راهنمای آهنگسازی و رفع اشکال در تمرین‌ها

هم‌اکنون هر پرسشی در ذهن دارید بپرسید یا یکی از موضوعات زیر را انتخاب کنید!`,
    timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
  },
];

const PRESET_PROMPTS = [
  'چگونه با ترفندهای بصری خطوط حامل (مثل چرخش کلید سل روی خط ۲ و خط ۳ سی) نت‌ها را سریع حفظ کنم؟',
  'چگونه بداهه‌نوازی در گام مینور پنتاتونیک و بلوز را شروع کنم؟',
  'تفاوت ساختاری دستگاه همایون با آواز بیات اصفهان چیست؟',
  'چگونه سرعت و استقلال انگشتان را روی کلاویه‌های پیانو تقویت کنم؟',
  'فرمول ساخت آکوردهای دیمینیشد (کاسته) و نحوه حل آنها در موسیقی کلاسیک',
  'تفاوت کسر میزان ۶/۸ با ۳/۴ چیست و چه تاثیری در حس ریتم دارد؟',
  'راهنمای خرید اولین ساز برای نوآموزان موسیقی',
];

export const AiMaestroChat: React.FC<AiMaestroChatProps> = ({ currentTimbre, initialPrompt }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      sendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send conversation context to server-side Gemini route
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      const replyText = data.reply || data.fallback || 'پاسخی از مربی دریافت نشد.';

      // Check if reply references playable notes like [C4, E4, G4]
      const notesMatch = replyText.match(/\[([A-G][b#]?\d(?:,\s*[A-G][b#]?\d)*)\]/);
      const playableNotes = notesMatch ? notesMatch[1].split(',').map((s: string) => s.trim()) : undefined;

      const botMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        content: replyText,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        audioNotes: playableNotes,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: 'متاسفانه در برقراری ارتباط با استاد هوشمند خطایی رخ داد. لطفاً چند لحظه دیگر مجدداً تلاش کنید.',
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  const playNotesSnippet = (notes: string[]) => {
    audioEngine.playSequence(notes.map((n) => ({ name: n })), currentTimbre, 300);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-[#131317] border border-white/10 rounded-[28px] p-5 sm:p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/10">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#F0F0F2] flex items-center gap-2">
              <span>استاد و مربی هوشمند امیتیس (Emitis AI Maestro)</span>
              <span className="text-[10px] bg-indigo-500/15 text-indigo-300 px-3 py-0.5 rounded-full border border-indigo-500/30 font-medium">
                پشتیبانی از تئوری شرق و غرب
              </span>
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              پاسخگوی صبور شما در تحلیل ملودی، هارمونی، ردیف ایرانی، تمرین‌های نوازندگی و سلفژ
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="text-xs text-white/50 hover:text-rose-400 flex items-center gap-1 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10 transition-colors relative z-10"
          title="شروع گفتگوی جدید"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>پاک‌کردن گفتگو</span>
        </button>
      </div>

      {/* Preset Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs text-white/40 shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
          <span>پیشنهادها:</span>
        </span>
        {PRESET_PROMPTS.map((p, i) => (
          <button
            key={i}
            id={`preset-prompt-${i}`}
            onClick={() => sendMessage(p)}
            className="text-xs bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded-full px-3.5 py-1.5 whitespace-nowrap transition-all"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Thread Container */}
      <div className="bg-[#131317] border border-white/10 rounded-[28px] p-5 sm:p-6 shadow-2xl min-h-[480px] max-h-[620px] flex flex-col justify-between relative overflow-hidden">
        {/* Messages Stream */}
        <div className="overflow-y-auto space-y-4 pr-1 pl-2 mb-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                    isUser
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-white/10 text-indigo-400 border border-white/10'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm space-y-2 ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20'
                      : 'bg-[#0F0F12] border border-white/10 text-white/80 rounded-tl-none shadow-md'
                  }`}
                >
                  {/* Sender & Timestamp */}
                  <div className="flex items-center justify-between text-[11px] opacity-60 pb-1 border-b border-white/10">
                    <span className="font-semibold">{isUser ? 'شما' : 'استاد امیتیس'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Body Text */}
                  <div className="whitespace-pre-line leading-relaxed font-sans text-[#F0F0F2]">
                    {msg.content}
                  </div>

                  {/* Optional Audio Player for notes in answer */}
                  {msg.audioNotes && msg.audioNotes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between bg-white/5 p-2 rounded-xl">
                      <span className="text-xs text-indigo-300 flex items-center gap-1">
                        <Music className="w-3.5 h-3.5" />
                        <span>نمونه نت‌های ذکر شده: [{msg.audioNotes.join(', ')}]</span>
                      </span>
                      <button
                        onClick={() => playNotesSnippet(msg.audioNotes!)}
                        className="px-3 py-1 bg-indigo-600 text-white font-bold rounded-full text-xs flex items-center gap-1 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-500/20"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>پخش</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-indigo-400 shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-[#0F0F12] border border-white/10 p-4 rounded-2xl rounded-tl-none text-xs text-indigo-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                <span className="text-white/50 mr-2">استاد امیتیس در حال نگارش پاسخ تخصصی...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="pt-4 border-t border-white/10 flex items-center gap-2.5 relative z-10"
        >
          <input
            type="text"
            id="ai-maestro-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="پرسش خود را درباره تئوری، آکورد، ردیف ایرانی یا تمرین ساز بنویسید..."
            disabled={isLoading}
            className="flex-1 bg-[#0F0F12] border border-white/10 focus:border-indigo-500 rounded-full px-5 py-3.5 text-xs sm:text-sm text-[#F0F0F2] placeholder-white/30 focus:outline-none shadow-inner"
          />

          <button
            type="submit"
            id="ai-maestro-send-btn"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50"
          >
            <span>ارسال</span>
            <Send className="w-4 h-4 -scale-x-100" />
          </button>
        </form>
      </div>
    </div>
  );
};
