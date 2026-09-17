export type NavigationTab = 
  | 'roadmap'
  | 'notation-notebook'
  | 'learn' 
  | 'piano' 
  | 'sight-reading' 
  | 'ear-training' 
  | 'dastgah' 
  | 'metronome' 
  | 'fretboard' 
  | 'ai-maestro'
  | 'search-grounding';

export type AppTab = 
  | 'roadmap'
  | 'notation-notebook'
  | 'piano' 
  | 'sight-reading' 
  | 'ear-training' 
  | 'dastgahs' 
  | 'lessons' 
  | 'fretboard' 
  | 'metronome' 
  | 'ai-maestro' 
  | 'search-lab';

export type InstrumentTimbre = 'piano' | 'grand_piano' | 'guitar' | 'flute' | 'synth' | 'harp';

export interface HandwritingRule {
  title: string;
  ruleFarsi: string;
  visualGraphic: string; // descriptive or ascii/svg indicator
  commonMistake: string;
  proTip: string;
}

export interface NotebookAssignment {
  id: string;
  level: 'مبتدی' | 'متوسط' | 'پیشرفته';
  title: string;
  description: string;
  targetNotes: string[]; // e.g. ["E4", "G4", "B4", "D5", "F5"]
  expectedClef: 'treble' | 'bass' | 'any';
  rulesToCheck: string;
  sampleVisualText: string;
  xpReward: number;
  badge: string;
}

export interface NotebookReviewResult {
  score: number;
  passed: boolean;
  detectedClef: string;
  detectedNotes: string[];
  detectedNotesFarsi: string[];
  strengths: string[];
  errors: string[];
  corrections: string[];
  calligraphyTip: string;
  overallVerdict: string;
}


export interface NoteInfo {
  name: string; // e.g. "C4", "D4", "F#4", "Ab4"
  farsiName: string; // e.g. "دو", "ر", "فا دیز", "لا بمل"
  solfege: string; // "Do", "Re", "Mi", "Fa", "Sol", "La", "Si"
  frequency: number; // Hz
  isBlack: boolean;
  midiNumber: number;
}

export interface Lesson {
  id: string;
  category: string;
  level: 'مقدماتی' | 'متوسط' | 'پیشرفته';
  title: string;
  subtitle: string;
  durationMinutes: number;
  content: {
    summary: string;
    sections: {
      heading: string;
      text: string;
      bulletPoints?: string[];
      notesToPlay?: string[];
      exampleLabel?: string;
    }[];
  };
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface DastgahScale {
  id: string;
  name: string;
  englishName: string;
  character: string;
  description: string;
  rootNote: string;
  notes: {
    name: string;
    farsi: string;
    centsOffset?: number; // microtones: -50 for Koron, +50 for Sori
    accidental?: 'natural' | 'sharp' | 'flat' | 'koron' | 'sori';
  }[];
  famousGoushehs: string[];
  popularPieces: string[];
  colorTheme: string;
}

export interface ChordDefinition {
  name: string;
  symbol: string;
  farsiName: string;
  formula: string;
  semitones: number[];
  type: 'major' | 'minor' | 'dominant' | 'diminished' | 'augmented' | 'suspended';
  description: string;
}

export interface EarTrainingQuestion {
  id: string;
  type: 'interval' | 'chord' | 'pitch' | 'melody';
  title: string;
  prompt: string;
  notesToPlay: string[];
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  audioNotes?: string[];
}

export type AgeGroup = 'kids' | 'teens' | 'adults';

export interface StageAgeContent {
  ageGroup: AgeGroup;
  stageTitle: string;
  stageSubtitle: string;
  storyExplanation: string;
  whyThisOrder: string;
  coreConcepts: string[];
  keyHacks: string[];
  examQuestions: RoadmapExamQuestion[];
  encouragement: string;
  avatarIcon?: string;
}

export interface RoadmapExamQuestion {
  id: string;
  question: string;
  type?: 'theory' | 'audio' | 'rhythm' | 'reading';
  notesToPlay?: string[];
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface RoadmapStage {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  category: string;
  iconName: string;
  estimatedHours: number;
  whyThisOrder: string;
  coreConcepts: string[];
  keyHacks: string[];
  suggestedAppTab: AppTab;
  tabLabel: string;
  examQuestions: RoadmapExamQuestion[];
  passingScorePercent: number; // e.g. 75
  xpReward: number; // e.g. 100
  badgeName: string;
  ageAdaptations?: Record<AgeGroup, StageAgeContent>;
}

export interface UserProgress {
  completedLessons: string[];
  earTrainingScore: number;
  sightReadingScore: number;
  streakDays: number;
  practiceTimeMinutes: number;
}
