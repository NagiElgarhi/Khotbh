export interface Sermon {
  id: number;
  surahNumber: number;
  title: string;
  pageNumber: number;
  verses: string;
  isCompleted: boolean;
  khutbah1: {
    title: string;
    verses: string;
    tafsir: string;
    reflections: string;
    messages: {
        message: string;
        explanation: string;
    }[];
    repentance: string;
  };
  khutbah2: {
    hadith: {
        text: string;
        authenticity: string;
    };
    hadithReflection: string;
    dua: string;
  };
}

export interface GeneratedSermonContent {
  title: string;
  verses: string;
  khutbah1: {
    title: string;
    verses: string;
    tafsir: string;
    reflections: string;
    messages: {
        message: string;
        explanation: string;
    }[];
    repentance: string;
  };
  khutbah2: {
    hadith: {
        text: string;
        authenticity: string;
    };
    hadithReflection: string;
    dua: string;
  };
}


export interface Surah {
  number: number;
  name: string;
  englishName: string;
  revelationType: string;
}

export type CompletedSermons = number[];