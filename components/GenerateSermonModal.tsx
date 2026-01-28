
import React, { useState, useEffect } from 'react';
import { Surah } from '../types.ts';
import { XIcon } from './icons.tsx';
import { surahPageMap } from '../data/quranMetadata.ts';
import { GoogleGenAI } from '@google/genai';

interface GenerateSermonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (surahNumber: number, topic: string) => Promise<void>;
  surahs: Surah[];
  isGenerating: boolean;
  error: string | null;
  apiKey: string;
}

export const GenerateSermonModal: React.FC<GenerateSermonModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  surahs,
  isGenerating,
  error,
  apiKey,
}) => {
  const [selectedSurah, setSelectedSurah] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [topicOptions, setTopicOptions] = useState<string[]>([]);
  
  const [previewVerses, setPreviewVerses] = useState<string>('');
  const [isPreviewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);


  useEffect(() => {
    if (selectedSurah) {
      const surahNum = parseInt(selectedSurah, 10);
      const pageInfo = surahPageMap[surahNum];
      const options: string[] = [];
      if (pageInfo) {
        for (let i = pageInfo.start; i <= pageInfo.end; i++) {
          options.push(`صفحة ${i} - الجزء الأول`);
          options.push(`صفحة ${i} - الجزء الثاني`);
        }
      }
      setTopicOptions(options);
      setTopic(''); 
      setPreviewVerses(''); 
    } else {
      setTopicOptions([]);
      setTopic('');
      setPreviewVerses('');
    }
  }, [selectedSurah]);

  useEffect(() => {
    if (topic && selectedSurah) {
        const surahNum = parseInt(selectedSurah, 10);
        const surahName = surahs.find(s => s.number === surahNum)?.name;

        const fetchVerses = async () => {
            const finalApiKey = apiKey || process.env.API_KEY;
            if (!finalApiKey) {
                setPreviewError("الرجاء إدخال مفتاح API في الشريط العلوي للمتابعة.");
                setPreviewLoading(false);
                return;
            }

            if (!surahName) {
                setPreviewError("لم يتم العثور على اسم السورة.");
                return;
            }

            setPreviewLoading(true);
            setPreviewError(null);
            setPreviewVerses('');

            const prompt = `مهمتك هي استخراج الآيات القرآنية الكاملة فقط بالتشكيل. لا تقم بإضافة أي نص أو تفسير أو مقدمات أو خاتمة. فقط نص الآيات.
السورة: ${surahName}
المقطع المطلوب: ${topic}
الرد المطلوب: قائمة بجميع الآيات في هذا المقطع، مع أرقامها بين قوسين، على سبيل المثال: "(١) بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (٢) الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ".`;

            try {
                const ai = new GoogleGenAI({ apiKey: finalApiKey });
                const response = await ai.models.generateContent({
                    model: "gemini-3-flash-preview",
                    contents: prompt,
                });
                setPreviewVerses(response.text || '');
            } catch (e) {
                console.error("Failed to fetch preview verses:", e);
                setPreviewError("فشل في جلب معاينة الآيات. يرجى المحاولة مرة أخرى.");
            } finally {
                setPreviewLoading(false);
            }
        };

        fetchVerses();

    } else {
        setPreviewVerses('');
        setPreviewError(null);
    }
}, [topic, selectedSurah, surahs, apiKey]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSurah && !isGenerating) {
      onGenerate(parseInt(selectedSurah, 10), topic);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col" role="document">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-teal-800">إنشاء خطبة جديدة</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        {isGenerating ? (
          <div className="p-12 text-center flex-grow flex items-center justify-center">
            <div>
              <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg text-gray-700">جاري إنشاء الخطبة...</p>
              <p className="text-sm text-gray-500">قد يستغرق هذا بعض الوقت. الرجاء عدم إغلاق النافذة.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-8 space-y-6 overflow-y-auto">
              {error && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                      <p className="font-bold">حدث خطأ</p>
                      <p>{error}</p>
                  </div>
              )}
              <div>
                <label htmlFor="surah" className="block text-lg font-semibold text-gray-700 mb-2">
                  اختر السورة <span className="text-red-500">*</span>
                </label>
                <select
                  id="surah"
                  value={selectedSurah}
                  onChange={(e) => setSelectedSurah(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
                  required
                >
                  <option value="" disabled>-- الرجاء اختيار سورة --</option>
                  {surahs.map(surah => (
                    <option key={surah.number} value={surah.number}>
                      {surah.number}. {surah.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="topic" className="block text-lg font-semibold text-gray-700 mb-2">
                  مقطع السورة (اختياري)
                </label>
                <select
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition disabled:bg-gray-100"
                  disabled={!selectedSurah || topicOptions.length === 0}
                >
                  <option value="">-- اختياري: اختر مقطعًا لتركيز الخطبة --</option>
                  {topicOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                 <p className="text-sm text-gray-500 mt-1">يساعد تحديد مقطع على تركيز الخطبة على آيات محددة من السورة.</p>
              </div>
              
              {(isPreviewLoading || previewVerses || previewError) && (
                <div className="p-4 bg-gray-100 rounded-lg min-h-[80px]">
                    <p className="text-md font-semibold text-gray-800 mb-2">معاينة الآيات للمقطع المحدد:</p>
                    {isPreviewLoading && (
                        <div className="flex items-center justify-center py-4">
                            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="ms-3 text-gray-600">جاري جلب الآيات...</p>
                        </div>
                    )}
                    {previewError && (
                        <p className="text-sm text-red-600 py-4 text-center">{previewError}</p>
                    )}
                    {previewVerses && !isPreviewLoading && (
                        <p className="text-md font-amiri text-gray-700 leading-relaxed whitespace-pre-wrap">{previewVerses}</p>
                    )}
                </div>
              )}

            </div>
            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end items-center gap-4 flex-shrink-0 border-t border-gray-200">
               <button type="button" onClick={onClose} className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-semibold">
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!selectedSurah || isGenerating}
                className="px-6 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 font-semibold disabled:bg-teal-300 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'جاري الإنشاء...' : 'إنشاء الخطبة'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
