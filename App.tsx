
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { allSermons as initialSermons } from './data/sermons.ts';
import { surahs } from './data/surahs.ts';
import { Sermon, GeneratedSermonContent } from './types.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { SermonView } from './components/SermonView.tsx';
import { GenerateSermonModal } from './components/GenerateSermonModal.tsx';
import { Footer } from './components/Footer.tsx';
import { SearchIcon, BookOpenIcon, CheckCircleIcon, PlusCircleIcon, MenuIcon } from './components/icons.tsx';
import { getAllSermons, addSermon, updateSermon } from './data/idb.ts';

const SermonCard: React.FC<{ sermon: Sermon; onSelect: (id: number) => void; isCompleted: boolean }> = ({ sermon, onSelect, isCompleted }) => (
    <div
        onClick={() => onSelect(sermon.id)}
        className="bg-white p-5 rounded-lg border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
    >
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-teal-700">{sermon.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{`سورة ${surahs.find(s => s.number === sermon.surahNumber)?.name || ''} - ${sermon.verses}`}</p>
            </div>
            {isCompleted && <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />}
        </div>
    </div>
);

const WelcomeGuide = () => (
    <div className="text-center py-10 px-6 bg-white rounded-lg border border-gray-200 mt-6">
        <h2 className="font-amiri text-4xl text-gray-800 mb-4">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</h2>
        <p className="text-xl text-teal-700 font-semibold mb-6">ابدأ رحلتك في إعداد خطب الجمعة بضغطة زر</p>
        
        <div className="text-start max-w-3xl mx-auto space-y-6">
            <div className="bg-orange-50 border-r-4 border-orange-400 p-4 rounded-md">
                <h3 className="font-bold text-orange-800">ملاحظة هامة ومسؤولية المراجعة</h3>
                <p className="text-orange-700 mt-2">
                    هذه الأداة تستخدم الذكاء الاصطناعي لإنشاء مسودات الخطب. أنت المسؤول مسؤولية كاملة عن مراجعة المحتوى وتدقيقه شرعيًا ولغويًا قبل استخدامه. تم ضبط الإعدادات لتوليد خطب مطولة جداً (تصل إلى 2000 كلمة).
                </p>
            </div>

            <div>
                <h3 className="text-2xl font-bold font-amiri text-gray-700 mb-3">دليل الاستخدام السريع</h3>
                <ol className="list-decimal list-inside space-y-3 text-gray-600">
                    <li>
                        <strong>الحصول على مفتاح API:</strong>
                        {' '}توجه إلى <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Google AI Studio</a> لإنشاء مفتاح API مجاني.
                    </li>
                    <li>
                        <strong>إدخال المفتاح:</strong>
                        {' '}قم بلصق المفتاح في الشريط العلوي ليتم حفظه.
                    </li>
                    <li>
                        <strong>توليد الخطبة:</strong>
                        {' '}اختر السورة، وسيقوم النظام بتوليد خطبة مفصلة جداً وشاملة.
                    </li>
                </ol>
            </div>
        </div>
    </div>
);


const App: React.FC = () => {
    const [sermons, setSermons] = useState<Sermon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSermonId, setSelectedSermonId] = useState<number | null>(null);
    const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    
    const [isModalOpen, setModalOpen] = useState(false);
    const [isGenerating, setGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    
    const [apiKey, setApiKey] = useState('');

    const completedCount = useMemo(() => sermons.filter(s => s.isCompleted).length, [sermons]);
    const progress = useMemo(() => (sermons.length > 0 ? (completedCount / sermons.length) * 100 : 0), [completedCount, sermons.length]);

    const isCompleted = useCallback((sermonId: number) => {
        return sermons.find(s => s.id === sermonId)?.isCompleted || false;
    }, [sermons]);
    
    const toggleComplete = useCallback(async (sermonId: number) => {
        const sermonToUpdate = sermons.find(s => s.id === sermonId);
        if (sermonToUpdate) {
            const updatedSermon = { ...sermonToUpdate, isCompleted: !sermonToUpdate.isCompleted };
            await updateSermon(updatedSermon);
            setSermons(currentSermons =>
                currentSermons.map(s => (s.id === sermonId ? updatedSermon : s))
            );
        }
    }, [sermons]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const dbSermons = await getAllSermons();
                setSermons(dbSermons.sort((a,b) => b.id - a.id)); 
            } catch (error) {
                console.error("Failed to load sermons from IndexedDB", error);
            } finally {
                setIsLoading(false);
            }
        };

        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            setApiKey(savedKey);
        }

        loadData();

        const handleResize = () => {
            if (window.innerWidth < 1024) {
              setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (searchTerm.trim() !== '') {
            setSelectedSermonId(null);
        }
    }, [searchTerm]);

    const handleApiKeyChange = (newKey: string) => {
        setApiKey(newKey);
        localStorage.setItem('gemini_api_key', newKey);
    };

    const filteredSermons = useMemo(() => {
        return sermons
            .filter(sermon => {
                if (selectedSurah && sermon.surahNumber !== selectedSurah) {
                    return false;
                }

                const lowerCaseSearch = searchTerm.toLowerCase().trim();
                if (!lowerCaseSearch) {
                    return true;
                }

                const surahName = surahs.find(s => s.number === sermon.surahNumber)?.name.toLowerCase() || '';
                
                const contentToSearch = [
                    sermon.title,
                    sermon.verses,
                    sermon.khutbah1.title,
                    sermon.khutbah1.verses,
                    sermon.khutbah1.tafsir,
                    sermon.khutbah1.reflections,
                    sermon.khutbah1.repentance,
                    ...sermon.khutbah1.messages.flatMap(msg => [msg.message, msg.explanation]),
                    sermon.khutbah2.hadith.text,
                    sermon.khutbah2.hadithReflection,
                    sermon.khutbah2.dua,
                    surahName,
                ].join(' ').toLowerCase();

                return contentToSearch.includes(lowerCaseSearch);
            })
            .sort((a,b) => b.id - a.id);
    }, [selectedSurah, searchTerm, sermons]);

    const handleSelectSermon = (id: number) => {
        setSelectedSermonId(id);
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    const handleBackToList = () => {
        setSelectedSermonId(null);
    };
    
    const handleSelectSurah = (surahNumber: number | null) => {
        setSelectedSurah(surahNumber);
        setSelectedSermonId(null);
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    const handleGenerateSermon = async (surahNumber: number, topic: string) => {
        setGenerating(true);
        setGenerationError(null);

        const finalApiKey = apiKey || process.env.API_KEY;
        if (!finalApiKey) {
            setGenerationError("الرجاء إدخال مفتاح API في الشريط العلوي للمتابعة.");
            setGenerating(false);
            return;
        }

        const surahName = surahs.find(s => s.number === surahNumber)?.name;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "عنوان رئيسي جذاب وشامل للخطبة." },
                verses: { type: Type.STRING, description: `مرجع للآيات المعتمدة.` },
                khutbah1: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "عنوان للخطبة الأولى." },
                        verses: { type: Type.STRING, description: "النص الكامل للآيات القرآنية مع التشكيل." },
                        tafsir: { type: Type.STRING, description: "تفسير وشرح مفصل جداً وموسع للآيات (يجب أن يتجاوز 500 كلمة في هذا الجزء وحده)." },
                        reflections: { type: Type.STRING, description: "تأملات إيمانية وعملية عميقة ومطولة جداً (يجب أن تكون غنية بالتفاصيل والأمثلة)." },
                        messages: {
                            type: Type.ARRAY,
                            description: "خمس رسائل إيمانية عملية (على الأقل) مفصلة للغاية.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    message: { type: Type.STRING, description: "رسالة قوية ومختصرة." },
                                    explanation: { type: Type.STRING, description: "شرح تطبيقي موسع جداً لهذه الرسالة في واقعنا المعاصر." },
                                },
                                required: ['message', 'explanation']
                            }
                        },
                        repentance: { type: Type.STRING, description: "دعوة مؤثرة ومطولة للتوبة والاستغفار." },
                    },
                    required: ['title', 'verses', 'tafsir', 'reflections', 'messages', 'repentance']
                },
                khutbah2: {
                    type: Type.OBJECT,
                    properties: {
                        hadith: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING, description: "النص الكامل للحديث مع التشكيل." },
                                authenticity: { type: Type.STRING, description: "درجة صحة الحديث ومصدره." },
                            },
                            required: ['text', 'authenticity']
                        },
                        hadithReflection: { type: Type.STRING, description: "شرح وتأمل مطول جداً في الحديث النبوي وربطه بموضوع الخطبة." },
                        dua: { type: Type.STRING, description: "دعاء ختامي شامل، جامع، ومطول جداً." },
                    },
                    required: ['hadith', 'hadithReflection', 'dua']
                },
            },
            required: ['title', 'verses', 'khutbah1', 'khutbah2']
        };

        const systemInstruction = `أنت خطيب مفوه وعالم بالشريعة. مهمتك الأساسية هي كتابة خطبة جمعة مطولة جداً وبأسلوب أدبي رصين. يجب أن يصل إجمالي عدد كلمات الخطبة إلى حوالي 2000 كلمة. اجعل الشروحات والتفسيرات والتأملات مسهبة ومفصلة لأقصى درجة ممكنة، مع مراعاة الجودة والموثوقية العلمية.`;

        const userPrompt = `أنشئ خطبة جمعة متكاملة وثرية جداً حول سورة "${surahName}". 
الهدف: كتابة خطبة مطولة جداً (المجموع 2000 كلمة). 
${topic ? `التركيز الخاص: "${topic}".` : ''}

المتطلبات الإضافية:
1. التفسير يجب أن يكون تحليلياً دقيقاً ومستفيضاً.
2. التأملات يجب أن تلامس جوانب عديدة من حياة المسلم المعاصر بإسهاب.
3. الرسائل العملية يجب أن تكون مفصلة بحيث يسهل على المستمع فهم كيفية التنفيذ.
4. الخطبة الثانية يجب أن تكون غنية بالاستنباطات من الحديث النبوي.`;

        try {
            const ai = new GoogleGenAI({ apiKey: finalApiKey });
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: userPrompt,
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });
            
            const generatedContent: GeneratedSermonContent = JSON.parse(response.text.trim());

            const newSermon: Sermon = {
                id: Date.now(),
                surahNumber: surahNumber,
                pageNumber: 0,
                isCompleted: false,
                ...generatedContent
            };

            await addSermon(newSermon);
            setSermons(prev => [newSermon, ...prev]);
            setModalOpen(false);
            handleSelectSermon(newSermon.id);

        } catch (e) {
            console.error("Failed to generate sermon:", e);
            let errorMessage = "فشل إنشاء الخطبة. يرجى التأكد من اتصالك بالإنترنت وصحة مفتاح API الخاص بك.";
            if (e instanceof Error && e.message.includes('API key')) {
                errorMessage = 'مفتاح API غير صالح. يرجى الحصول على مفتاح جديد من Google AI Studio.';
            }
            setGenerationError(errorMessage);
        } finally {
            setGenerating(false);
        }
    };

    const handleToggleSidebar = () => {
      setSidebarOpen(prev => !prev);
    };

    const selectedSermon = sermons.find(s => s.id === selectedSermonId);
    const surahName = selectedSermon ? (surahs.find(s => s.number === selectedSermon.surahNumber)?.name || '') : (selectedSurah ? surahs.find(s => s.number === selectedSurah)?.name : 'كل الخطب');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl font-bold text-teal-800">جاري تحميل المنبر...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen relative md:flex">
            <Sidebar
                surahs={surahs}
                selectedSurah={selectedSurah}
                onSelectSurah={handleSelectSurah}
                progress={progress}
                completedCount={completedCount}
                totalSermons={sermons.length}
                isOpen={isSidebarOpen}
                onToggle={handleToggleSidebar}
            />

            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:mr-64' : 'mr-0'}`}>
                <header className="sticky top-0 bg-teal-800 text-white border-b border-teal-900/50 z-20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-y-4">
                        <div className="flex items-center gap-4">
                              <button 
                                className="p-1" 
                                onClick={handleToggleSidebar}
                                aria-label="Toggle Menu"
                            >
                                <MenuIcon className="w-6 h-6"/>
                            </button>
                            <h1 className="text-2xl font-bold">منبر الجمعة</h1>
                        </div>
                        
                        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap justify-end w-full md:w-auto">
                            <div className="relative max-w-[16rem] flex-grow md:flex-grow-0">
                                <input
                                    type="text"
                                    placeholder="ابحث بالآية أو الكلمة..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 pe-10 bg-teal-700/80 border border-teal-600 text-white rounded-full focus:ring-2 focus:ring-teal-400 focus:bg-teal-700 transition placeholder:text-teal-200/80 placeholder:font-semibold"
                                />
                                <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
                                    <SearchIcon className="w-5 h-5 text-teal-300" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="password"
                                    placeholder="أدخل مفتاح Apikey هنا"
                                    value={apiKey}
                                    onChange={(e) => handleApiKeyChange(e.target.value)}
                                    className="px-3 py-2 bg-teal-700/80 border border-teal-600 text-white rounded-lg focus:ring-2 focus:ring-teal-400 focus:bg-teal-700 transition w-40 md:w-48 placeholder:text-teal-200/80 placeholder:font-semibold"
                                    aria-label="API Key Input"
                                />
                                <a 
                                    href="https://aistudio.google.com/app/apikey" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex-shrink-0 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
                                >
                                    احصل على Apikey
                                </a>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1">
                    <div className="p-4 md:p-6">
                        {selectedSermon ? (
                            <SermonView
                                sermon={selectedSermon}
                                onBack={handleBackToList}
                                isCompleted={isCompleted(selectedSermon.id)}
                                onToggleComplete={toggleComplete}
                                surahName={surahName}
                            />
                        ) : (
                            <div>
                                <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 flex flex-wrap justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                        <BookOpenIcon className="w-6 h-6 text-teal-600"/>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800">
                                                {`عرض خطب: ${selectedSurah ? surahName : 'كل الخطب'}`}
                                            </h2>
                                            <p className="text-gray-600">{`${filteredSermons.length} خطبة متاحة`}</p>
                                        </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setGenerationError(null);
                                        setModalOpen(true);
                                    }} 
                                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors">
                                        <PlusCircleIcon className="w-5 h-5"/>
                                        <span>إنشاء خطبة جديدة (2000 كلمة)</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                                    {filteredSermons.map(sermon => (
                                        <SermonCard
                                            key={sermon.id}
                                            sermon={sermon}
                                            onSelect={handleSelectSermon}
                                            isCompleted={isCompleted(sermon.id)}
                                        />
                                    ))}
                                </div>
                                {filteredSermons.length === 0 && searchTerm && (
                                    <div className="text-center py-16 text-gray-500">
                                        <p className="text-xl">لم يتم العثور على نتائج.</p>
                                        <p>حاول تغيير فلتر السورة أو مصطلح البحث.</p>
                                    </div>
                                )}
                                {sermons.length === 0 && !searchTerm && !isLoading && (
                                    <WelcomeGuide />
                                )}
                            </div>
                        )}
                    </div>
                </main>

                <Footer />
            </div>

            <GenerateSermonModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onGenerate={handleGenerateSermon}
                surahs={surahs}
                isGenerating={isGenerating}
                error={generationError}
                apiKey={apiKey}
            />
        </div>
    );
};

export default App;
