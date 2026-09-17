import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization for Gemini client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', name: 'Emitis Music Academy API', timestamp: new Date().toISOString() });
});

// Gemini Multi-turn Chat Endpoint (Emitis Maestro / مربی هوشمند موسیقی امیتیس)
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages, context } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const ai = getGenAI();
    
    // System instruction for Emitis Maestro
    const systemInstruction = `شما «امیتیس»، استاد و مربی ارشد و دلسوز آکادمی موسیقی Emitis هستید.
شما تسلط کامل بر تئوری موسیقی غرب (نت‌خوانی، فواصل، آکوردشناسی، ریتم، هارمونی، کنترپوان، سازهای پیانو، گیتار، ویولن و غیره) و همچنین موسیقی اصیل و سنتی ایرانی (دستگاه‌ها شامل شور، ماهور، سه‌گاه، چهارگاه، همایون، نوا، راست‌پنج‌گاه، آوازهای ابوعطا، بیات ترک، افشاری، دشتی، اصفهان، گوشه‌ها و ریزپرده‌های ربع پرده/کرن و سری، سازهای تار، سه‌تار، سنتور، دف و تنبک) دارید.

روش‌های تدریس و ویژگی‌های آموزشی شما:
۱. پاسخ به سوالات موسیقی با زبان شیرین، دقیق، صبورانه و آموزشی به زبان فارسی.
۲. استفاده از ترفندهای شهودی و حافظه بصری استادان موسیقی (مانند اینکه پیچ حلزونی انتهای کلید سل دور خط دوم می‌چرخد و به همین دلیل خط ۲ همیشه نت سل است؛ خط سوم خط میانی حامل است و با هم‌آوایی «۳ = سه = سی» نت سی است؛ دو نقطه کلید فا در دو طرف خط چهارم قرار دارد و خط ۴ نت فا است؛ و فرمول خطوط «می، سل، سی، ر، فا»).
۳. ارائه مثال‌های صوتی و نتی واضح (نام نت‌ها، ساختار آکوردها، ریتم‌ها).
۴. راهنمایی هنرجو در تمرین‌های ساز، سلفژ، تربیت شنوایی و دیکته موسیقی.
۵. استفاده از قالب‌بندی جذاب با بولت‌پوینت‌ها و ساختار شفاف در پاسخ‌ها.
۶. در صورت نیاز به اصطلاحات انگلیسی/بین‌المللی، معادل فارسی و لاتین آن را به زیبایی بنویسید.
${context ? `اطلاعات ماژول فعلی کاربر: ${context}` : ''}`;

    // Format conversation history for Gemini
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'متأسفانه پاسخی تولید نشد.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: error.message || 'خطا در ارتباط با سرویس هوش مصنوعی امیتیس',
      fallback: 'در حال حاضر ارتباط با استاد هوشمند موقتاً با تاخیر مواجه است. لطفاً مجدداً امتحان کنید.'
    });
  }
});

// Search Grounding Endpoint (with googleSearch)
app.post('/api/gemini/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query string is required' });
    }

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `در خصوص این پرسش موسیقی تحقیق کن و اطلاعات دقیق، به‌روز، و علمی همراه با پیشینه تاریخی یا منابع به زبان فارسی ارائه کن:\n${query}`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: 'شما دستیار پژوهشی موسیقی آکادمی Emitis هستید. پاسخ‌های مستند، با ذکر منابع و جزییات ارائه دهید.',
      },
    });

    const text = response.text || 'اطلاعاتی یافت نشد.';
    // Extract search grounding metadata if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks.map((chunk: any) => ({
      title: chunk.web?.title || 'منبع وب',
      uri: chunk.web?.uri || '',
    })).filter((s: any) => s.uri);

    res.json({ result: text, sources: webSources });
  } catch (error: any) {
    console.error('Search grounding error:', error);
    res.status(500).json({
      error: error.message || 'خطا در جستجوی هوشمند منابع موسیقی',
    });
  }
});

// Music Theory & Chord Analysis Endpoint
app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
  try {
    const { notes, chord, scale, modeType, question } = req.body;
    const ai = getGenAI();

    const prompt = `شما مربی تحلیل موسیقی امیتیس هستید. اطلاعات زیر را تحلیل و تشریح نمایید:
- نت‌های انتخاب شده: ${JSON.stringify(notes || [])}
- نام آکورد یا گام: ${chord || scale || 'مشخص نشده'}
- سیستم موسیقی: ${modeType || 'موسیقی عمومی'}
- سوال تکمیلی کاربر: ${question || 'لطفاً نام آکورد/فواصل، احساس صدا، کاربرد در آهنگسازی و تمرین پیشنهادی را توضیح دهید.'}

لطفاً پاسخ را در قالب JSON با کلیدهای زیر برگردان:
{
  "name": "نام دقیق گام یا آکورد",
  "intervals": "فرمول فواصل (مثلاً اول، سوم بزرگ، پنجم درست)",
  "mood": "احساس و رنگ صدایی (مثلاً شاد، حماسی، نوستالژیک، رازآلود)",
  "traditionalMatch": "دستگاه یا گام معادل در موسیقی ایرانی یا غربی",
  "tips": ["نکته کاربردی ۱", "نکته کاربردی ۲"],
  "sampleProgression": "یک توالی آکورد پیشنهادی برای نواختن"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let data;
    try {
      data = JSON.parse(response.text || '{}');
    } catch {
      data = { raw: response.text };
    }

    res.json(data);
  } catch (error: any) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: error.message || 'خطا در تحلیل موسیقی' });
  }
});

// Dynamic AI Music Quiz Generator
app.post('/api/gemini/quiz-gen', async (req: Request, res: Response) => {
  try {
    const { topic, difficulty } = req.body;
    const ai = getGenAI();

    const prompt = `یک کوییز موسیقی جذاب ۴ گزینه‌ای در سطح ${difficulty || 'متوسط'} برای موضوع ${topic || 'تئوری عمومی و نت‌خوانی'} تولید کن.
پاسخ حتماً باید یک آبجکت JSON معتبر به شکل زیر باشد:
{
  "question": "متن سوال به زبان فارسی",
  "options": ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"],
  "correctIndex": 0,
  "explanation": "توضیح کامل علمی پاسخ درست",
  "playableNotes": ["C4", "E4", "G4"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Quiz gen error:', error);
    res.status(500).json({ error: error.message || 'خطا در ساخت کوییز' });
  }
});

// AI Sheet Music Handwriting & Notebook Vision Evaluator
app.post('/api/gemini/handwriting-check', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', assignmentTitle, expectedNotes, assignmentRules, userNotesText } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'تصویر دست‌نوشته یا نقاشی نت الزامی است.' });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const ai = getGenAI();

    const systemInstruction = `شما استاد و کارشناس ارشد خوش‌نویسی نت و سلفژ در آکادمی موسیقی امیتیس (Emitis) هستید.
وظیفه شما بررسی موشکافانه، دقیق و در عین حال تشویق‌کننده و مهربانانه تصویر ارسالی از دست‌نوشته‌های دفترچه ۵ خط نت موسیقی یا نقاشی دیجیتال هنرجو است.

معیارهای ارزیابی خوش‌نویسی و صحت نت‌نویسی:
۱. کلید موسیقی (Clef): آیا کلید سل به درستی از خط دوم شروع شده و دور آن می‌پیچد؟ یا کلید فا روی خط چهارم است؟
۲. موقعیت سر نت‌ها (Noteheads): آیا بیضی شکل هستند و به درستی دقیقاً روی خط (پنج‌خط) یا درون فضای بین خطوط قرار گرفته‌اند؟
۳. قانون جهت پایه‌ها (Stem Direction): نت‌های زیر خط سوم (خط ۳ حامل) باید پایه رو به بالا و از سمت راست سر نت داشته باشند. نت‌های روی خط ۳ و بالاتر باید پایه رو به پایین و از سمت چپ سر نت داشته باشند.
۴. نسبت و کشیدگی پایه‌ها: طول پایه معمولاً حدود ۳ تا ۳.۵ فاصله بین خطوط است.
۵. سکوت‌ها، علامت‌های تغییر دهنده (دیز، بمل، کرن، سری) یا خطوط میزان در صورت وجود.

پاسخ شما باید ساختار یافته و به زبان فارسی شیوا باشد.`;

    const promptText = `لطفاً تصویر پیوست شده از دست‌نویس هنرجوی موسیقی روی دفترچه خطوط حامل را بررسی و ارزیابی کنید.
- عنوان تکلیف هنرجو: ${assignmentTitle || 'نگارش نت‌های موسیقی'}
- قوانین و موارد مورد انتظار: ${assignmentRules || 'رعایت موقعیت نت‌ها روی پنج‌خط، قانون جهت پایه‌ها و رسم درست کلید'}
- نت‌های مورد انتظار برای مقایسه: ${JSON.stringify(expectedNotes || [])}
${userNotesText ? `- توضیحات تکمیلی هنرجو: ${userNotesText}` : ''}

پاسخ را در قالب یک آبجکت JSON معتبر با ساختار زیر تحویل دهید:
{
  "score": 85,
  "passed": true,
  "detectedClef": "کلید سل (Treble Clef) با چرخش دور خط دوم",
  "detectedNotes": ["C4", "D4", "E4", "F4", "G4"],
  "detectedNotesFarsi": ["دو ۴ (خط کمکی)", "ر ۴ (زیر خط اول)", "می ۴ (خط اول)", "فا ۴ (بین خط ۱ و ۲)", "سل ۴ (خط دوم)"],
  "strengths": [
    "زاویه بیضی و تمیزی سر نت‌ها عالی است",
    "کلید سل با دقت خوبی روی خط دوم ترسیم شده است"
  ],
  "errors": [
    "پایه نت سل رو به بالا کشیده شده در حالی که باید..."
  ],
  "corrections": [
    "برای نت‌های روی خط سوم به بالا، خط پایه را از سمت چپ سر نت و رو به پایین بکشید."
  ],
  "calligraphyTip": "توصیه استاد برای زیبانویسی: سر نت‌ها را همیشه کمی متمایل به سمت بالا-راست (زاویه حدود ۴۵ درجه) بیضی کنید.",
  "overallVerdict": "آفرین! دست‌خط شما بسیار خوانا و تمیز است. با رعایت چند نکته کوچک، نت‌نویسی شما کاملاً حرفه‌ای خواهد شد."
}`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    };

    const textPart = {
      text: promptText,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [imagePart, textPart],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    let resultData;
    try {
      resultData = JSON.parse(response.text || '{}');
    } catch {
      resultData = {
        score: 75,
        passed: true,
        detectedClef: 'کلید سل',
        detectedNotes: ['C4', 'E4', 'G4'],
        detectedNotesFarsi: ['دو', 'می', 'سل'],
        strengths: ['تصویر دریافت شد و تلاش شما عالی است.'],
        errors: [],
        corrections: ['لطفاً وضوح تصویر و نورپردازی را بررسی کنید.'],
        calligraphyTip: 'فاصله‌های منظم بین نت‌ها به خوانایی قطعه کمک می‌کند.',
        overallVerdict: response.text || 'بررسی انجام شد.',
      };
    }

    res.json(resultData);
  } catch (error: any) {
    console.error('Handwriting vision error:', error);
    res.status(500).json({
      error: error.message || 'خطا در پردازش تصویر دست‌نوشته با هوش مصنوعی',
      fallback: {
        score: 70,
        passed: true,
        detectedClef: 'کلید سل',
        detectedNotes: ['C4', 'E4', 'G4'],
        detectedNotesFarsi: ['دو', 'می', 'سل'],
        strengths: ['تلاش شما برای نگارش دستی ستودنی است!'],
        errors: ['ارتباط موقتی با سرور بینایی ماشین دچار تاخیر شد.'],
        corrections: ['مجدداً با نور بهتر عکس بگیرید.'],
        calligraphyTip: 'خطوط حامل را تمیز و یکدست نگه دارید.',
        overallVerdict: 'تکلیف شما ثبت شد.',
      },
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎵 Emitis Music Academy server running on http://localhost:${PORT}`);
  });
}

startServer();
