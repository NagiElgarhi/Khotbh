
import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Sermon } from '../types.ts';
import { PlayCircleIcon, CheckCircleIcon, ArrowRightIcon, DownloadIcon, PrintIcon, CopyIcon, WhatsAppIcon } from './icons.tsx';

interface SermonViewProps {
  sermon: Sermon;
  onBack: () => void;
  isCompleted: boolean;
  onToggleComplete: (id: number) => void;
  surahName: string;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h3 className="text-2xl font-bold font-amiri text-teal-800 border-b-2 border-teal-200 pb-2 mb-4">{title}</h3>
        {children}
    </div>
);

export const SermonView: React.FC<SermonViewProps> = ({ sermon, onBack, isCompleted, onToggleComplete, surahName }) => {
  const sermonContentRef = useRef<HTMLDivElement>(null);
  const [isCopyTextVisible, setCopyTextVisible] = useState(false);
  const [copyableText, setCopyableText] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('نسخ المحتوى');

  const handlePrint = () => {
    window.print();
  };

  const getFormattedHTMLString = () => {
    const { khutbah1, khutbah2 } = sermon;
    const colorPairs = [
      { bg: '#064e3b', text: '#ecfdf5', border: '#059669' },
      { bg: '#fefce8', text: '#713f12', border: '#eab308' },
      { bg: '#0c4a6e', text: '#f0f9ff', border: '#0284c7' },
      { bg: '#fff7ed', text: '#7c2d12', border: '#f97316' },
      { bg: '#451a03', text: '#fff7ed', border: '#d97706' },
      { bg: '#fdf2f8', text: '#831843', border: '#db2777' },
      { bg: '#171717', text: '#fafafa', border: '#404040' },
    ];

    let colorIdx = 0;
    const getNextColor = () => colorPairs[colorIdx++ % colorPairs.length];

    const renderBox = (content: string, title?: string) => {
        if (!content) return '';
        const colors = getNextColor();
        return `
        <div style="background-color: ${colors.bg}; color: ${colors.text}; padding: 35px; margin-bottom: 25px; border-radius: 20px; line-height: 2.2; font-size: 1.5rem; border-right: 12px solid ${colors.border}; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); font-family: 'Amiri', serif; direction: rtl;">
            ${title ? `<div style="font-weight: bold; border-bottom: 2px solid ${colors.border}; padding-bottom: 12px; margin-bottom: 20px; font-size: 1.8rem; font-family: 'Cairo', sans-serif;">${title}</div>` : ''}
            <div style="white-space: pre-wrap;">${content.replace(/\n/g, '<br>')}</div>
        </div>`;
    };

    let contentHtml = '';
    contentHtml += renderBox(khutbah1.verses, "بداية الخطبة والاستفتاح (الآيات)");
    contentHtml += renderBox(khutbah1.tafsir, "التفسير والشرح المفصل");
    contentHtml += renderBox(khutbah1.reflections, "التأملات واللطائف الإيمانية");
    const messagesHtml = khutbah1.messages.map(m => `<div style="margin-bottom: 20px;"><strong style="font-size: 1.7rem; color: inherit;">• ${m.message}</strong><br>${m.explanation}</div>`).join('');
    contentHtml += renderBox(messagesHtml, "الرسائل العملية التطبيقية");
    contentHtml += renderBox(khutbah1.repentance, "الاستغفار والدعوة للتوبة");
    contentHtml += renderBox(`<strong>${khutbah2.hadith.text}</strong><br><em style="font-size: 1.1rem; opacity: 0.9;">درجة الصحة: ${khutbah2.hadith.authenticity}</em>`, "الخطبة الثانية: الحديث الشريف");
    contentHtml += renderBox(khutbah2.hadithReflection, "تأمل في الحديث النبوي");
    contentHtml += renderBox(khutbah2.dua, "الدعاء الختامي الجامع");

    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${sermon.title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Cairo', sans-serif; background-color: #e2e8f0; margin: 0; padding: 60px 20px; display: flex; justify-content: center; direction: rtl; }
      .container { max-width: 1000px; width: 100%; }
      h1 { text-align: center; color: #1e293b; margin-bottom: 10px; font-family: 'Amiri', serif; font-size: 4rem; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
      .meta { text-align: center; color: #475569; margin-bottom: 40px; font-weight: bold; font-size: 1.3rem; border-bottom: 2px solid #cbd5e1; padding-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="meta">سورة ${surahName} | المرجع: ${sermon.verses}</div>
        <h1>${sermon.title}</h1>
        ${contentHtml}
        <div style="text-align: center; margin-top: 60px; color: #94a3b8; font-size: 1.1rem; padding: 30px 0; border-top: 2px solid #cbd5e1;">
            تم توليد وتنسيق هذه الخطبة بواسطة منصة "آيات الرحمن فى خطبة الجمعة" - NSS 2025
        </div>
    </div>
</body>
</html>`;
  };

  const handleDownloadHTML = () => {
    const content = sermonContentRef.current?.innerHTML;
    if (!content) return;

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${sermon.title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Cairo', sans-serif; background-color: #f9fafb; display: flex; justify-content: center; padding: 1rem; }
      .font-amiri { font-family: 'Amiri', serif; }
      .sermon-container { max-width: 896px; width: 100%; background-color: white; padding: 2rem; border-radius: 0.5rem; }
    </style>
</head>
<body>
    <div class="sermon-container">${content}</div>
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sermon.title}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFormattedHTML = () => {
    const html = getFormattedHTMLString();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `خطبة_${sermon.title.replace(/ /g, '_')}_ملونة_مشكولة.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleWhatsAppShare = async () => {
    const html = getFormattedHTMLString();
    const blob = new Blob([html], { type: 'text/html' });
    const fileName = `خطبة_${sermon.title.replace(/ /g, '_')}_ملونة.html`;
    const file = new File([blob], fileName, { type: 'text/html' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: sermon.title,
                text: `خطبة الجمعة: ${sermon.title}`,
            });
        } catch (e) {
            console.error(e);
        }
    } else {
        const text = encodeURIComponent(`خطبة الجمعة: ${sermon.title}\nيمكنك تحميل الخطبة كاملة من تطبيق آيات الرحمن.`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

 const handleDownloadPDF = () => {
    const input = sermonContentRef.current;
    if (!input) {
      console.error("Sermon content ref not found!");
      return;
    }

    input.style.width = '1024px';

    html2canvas(input, {
        useCORS: true,
        scale: 2, 
        backgroundColor: '#ffffff', 
        logging: false,
        onclone: (documentClone) => {
            const style = documentClone.createElement('style');
            style.innerHTML = `
                body { font-family: 'Cairo', sans-serif !important; }
                .font-amiri { font-family: 'Amiri', serif !important; }
            `;
            documentClone.head.appendChild(style);
        }
    }).then(canvas => {
        input.style.width = '';

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        const ratio = canvasWidth / pdfWidth;
        const imgHeight = canvasHeight / ratio;
        
        let heightLeft = imgHeight;
        let position = 0;
        const margin = 10;
        const contentWidth = pdfWidth - margin * 2;
        const contentHeight = (canvas.height * contentWidth) / canvas.width;


        if (imgHeight < pdfHeight) {
             pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
        } else {
            let page = 1;
            while(heightLeft > 0) {
                pdf.addImage(imgData, 'PNG', margin, position - ((page-1)*pdfHeight), contentWidth, contentHeight);
                heightLeft -= (pdfHeight - (margin*2));
                position -= (pdfHeight - (margin*2));
                if (heightLeft > 0) {
                    pdf.addPage();
                    page++;
                }
            }
        }
        
        pdf.save(`${sermon.title.replace(/ /g, '_')}.pdf`);
    }).catch(err => {
        console.error("Error generating PDF:", err);
        input.style.width = '';
    });
};

  const createCopyableText = () => {
      const { khutbah1, khutbah2 } = sermon;
      const parts = [
        `عنوان الخطبة: ${sermon.title}`,
        `المرجع: ${sermon.verses}`,
        `--- الخطبة الأولى ---`,
        khutbah1.title,
        khutbah1.verses,
        `التفسير:`,
        khutbah1.tafsir,
        `التأملات:`,
        khutbah1.reflections,
        `الرسائل الإيمانية:`,
        ...khutbah1.messages.map(item => `• ${item.message}\n${item.explanation}`),
        khutbah1.repentance,
        `--- الخطبة الثانية ---`,
        `الحديث الشريف:`,
        khutbah2.hadith.text,
        `درجة الحديث: ${khutbah2.hadith.authenticity}`,
        `تأمل في الحديث:`,
        khutbah2.hadithReflection,
        `الدعاء الجامع:`,
        khutbah2.dua,
        "... وأقم الصلاة"
      ];
      const fullText = parts.join('\n\n');
      setCopyableText(fullText);
      setCopyTextVisible(true);
  };

  const handleCopyToClipboard = () => {
      if(!navigator.clipboard) {
        setCopyButtonText('النسخ غير مدعوم');
        return;
      }
      navigator.clipboard.writeText(copyableText).then(() => {
          setCopyButtonText('تم النسخ!');
          setTimeout(() => setCopyButtonText('نسخ المحتوى'), 2000);
      }).catch(err => {
          console.error('Failed to copy text: ', err);
          setCopyButtonText('فشل النسخ');
          setTimeout(() => setCopyButtonText('نسخ المحتوى'), 2000);
      });
  };


  return (
    <div className="p-4 md:p-8 bg-white rounded-lg shadow-sm">
      <div className="printable-sermon">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <button onClick={onBack} className="flex items-center gap-2 text-teal-700 hover:text-teal-900 font-semibold">
              <ArrowRightIcon />
              <span>العودة إلى القائمة</span>
          </button>
          <div className="flex items-center gap-2">
              <button onClick={handleWhatsAppShare} title="مشاركة عبر واتساب" className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors">
                  <WhatsAppIcon className="w-5 h-5"/>
              </button>
              <button onClick={handleDownloadHTML} title="تحميل كملف HTML" className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-full transition-colors">
                  <DownloadIcon className="w-5 h-5"/>
              </button>
              <button onClick={handleDownloadPDF} title="تحميل كملف PDF" className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-full transition-colors">
                  <DownloadIcon className="w-5 h-5 text-red-600"/>
              </button>
              <button onClick={handlePrint} title="طباعة" className="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-full transition-colors">
                  <PrintIcon className="w-5 h-5"/>
              </button>
          </div>
        </div>
        
        <div ref={sermonContentRef} className="max-w-4xl mx-auto">
          <header className="text-center mb-8 border-b-4 border-gray-100 pb-6">
              <p className="text-lg text-gray-500">{`سورة ${surahName}${sermon.pageNumber > 0 ? ` - الصفحة ${sermon.pageNumber}` : ''}`}</p>
              <h1 className="text-4xl md:text-5xl font-bold font-amiri text-gray-800 mt-2">{sermon.title}</h1>
              <p className="text-md text-gray-600 mt-3">{`الآيات المعتمدة: ${sermon.verses}`}</p>
          </header>

          <div className="space-y-6">
              <div className="flex justify-center items-center gap-4 mb-8 print:hidden">
                  <button 
                      onClick={() => onToggleComplete(sermon.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors ${isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                      <CheckCircleIcon className="w-5 h-5"/>
                      <span>{isCompleted ? 'تم إتمامها' : 'إتمام الخطبة'}</span>
                  </button>
                   <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold transition-colors"  title="سيتم تفعيلها لاحقًا">
                      <PlayCircleIcon className="w-5 h-5"/>
                      <span>استماع (قريبًا)</span>
                  </button>
              </div>

              <div className="p-6 border border-gray-200 rounded-lg bg-gray-50/50">
                  <h2 className="text-3xl font-bold font-amiri text-center text-teal-900 mb-6">الخطبة الأولى: {sermon.khutbah1.title}</h2>
                  <Section title="الآيات المعتمدة والاستفتاح"><p className="text-xl leading-loose font-amiri text-gray-800 text-center bg-white p-4 rounded-md shadow-sm whitespace-pre-wrap">{sermon.khutbah1.verses}</p></Section>
                  <Section title="تفسير وشرح مستفيض"><p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">{sermon.khutbah1.tafsir}</p></Section>
                  <Section title="تأملات ولطائف"><p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">{sermon.khutbah1.reflections}</p></Section>
                  <Section title="رسائل إيمانية">
                      <ul className="space-y-4">
                          {sermon.khutbah1.messages.map((item, index) => (
                              <li key={index} className="p-4 bg-white rounded-lg shadow-sm border-r-4 border-teal-500">
                                  <p className="flex items-start"><span className="text-teal-600 font-bold me-2 text-xl">◆</span><span className="text-lg font-semibold text-gray-800">{item.message}</span></p>
                                  <p className="mt-2 ms-7 text-md text-gray-600 leading-relaxed">{item.explanation}</p>
                              </li>
                          ))}
                      </ul>
                  </Section>
                  <Section title="دعوة للاستغفار والتوبة"><p className="text-lg leading-relaxed text-gray-700 italic whitespace-pre-wrap">{sermon.khutbah1.repentance}</p></Section>
              </div>
              
              <div className="p-6 border border-gray-200 rounded-lg bg-gray-50/50">
                  <h2 className="text-3xl font-bold font-amiri text-center text-teal-900 mb-6">الخطبة الثانية</h2>
                  <Section title="حديث نبوي">
                      <div className="bg-white p-4 rounded-md shadow-sm">
                          <p className="text-lg leading-relaxed font-semibold text-gray-800">{sermon.khutbah2.hadith.text}</p>
                          <p className="text-sm text-gray-500 mt-2 text-start pt-2 border-t border-gray-100"><span className="font-bold">درجة الحديث:</span> {sermon.khutbah2.hadith.authenticity}</p>
                      </div>
                  </Section>
                  <Section title="تأمل في الحديث"><p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">{sermon.khutbah2.hadithReflection}</p></Section>
                  <Section title="دعاء ختامي جامع"><p className="text-lg leading-loose text-gray-700 whitespace-pre-wrap">{sermon.khutbah2.dua}</p></Section>
              </div>
              
              <div className="text-center text-xl font-bold text-teal-800 py-4 mt-8">... وَأَقِمِ الصَّلَاةَ</div>
              <div className="mt-8 p-4 bg-orange-50 border-r-4 border-orange-400 rounded-md text-start">
                  <h4 className="font-bold text-orange-800">ملاحظة هامة</h4>
                  <p className="text-orange-700 mt-1">هذه الخطبة تم إنشاؤها بواسطة الذكاء الاصطناعي. تقع على عاتقك مسؤولية مراجعتها وتدقيقه لغويًا وشرعيًا قبل إلقائها.</p>
              </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto mt-8 print:hidden">
        {!isCopyTextVisible ? (
          <div className="text-center">
            <button 
                onClick={createCopyableText} 
                className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
                إنشاء نص للنسخ (والتحميل الملون)
            </button>
          </div>
        ) : (
          <div className="p-4 border border-gray-300 rounded-lg bg-gray-50/50">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4 border-b border-gray-200 pb-3">
                  <h4 className="font-bold text-gray-800">نص الخطبة جاهز للنسخ والتحميل</h4>
                  <div className="flex flex-wrap items-center gap-2">
                      <button 
                          onClick={handleWhatsAppShare} 
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-sm"
                          title="مشاركة الملف عبر واتساب"
                      >
                          <WhatsAppIcon className="w-5 h-5"/>
                          <span>مشاركة عبر واتساب</span>
                      </button>
                      <button 
                          onClick={handleDownloadFormattedHTML} 
                          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all shadow-sm"
                          title="تحميل كملف HTML ملون للقراءة السهلة والتشكيل"
                      >
                          <DownloadIcon className="w-5 h-5"/>
                          <span>تحميل HTML ملون</span>
                      </button>
                      <button 
                          onClick={handleCopyToClipboard} 
                          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:bg-teal-400 transition-all shadow-sm"
                      >
                          <CopyIcon className="w-5 h-5"/>
                          <span>{copyButtonText}</span>
                      </button>
                  </div>
              </div>
              <textarea
                  readOnly
                  className="w-full h-80 p-3 border border-gray-200 rounded-md bg-white font-amiri text-lg leading-loose resize-y focus:outline-none focus:ring-1 focus:ring-teal-500"
                  value={copyableText}
                  dir="rtl"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">يمكنك تحميل نسخة HTML الملونة أو مشاركتها مباشرة عبر واتساب لتسهيل القراءة والخطابة.</p>
          </div>
        )}
      </div>

    </div>
  );
};
