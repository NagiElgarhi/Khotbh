
import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Sermon } from '../types.ts';
import { PlayCircleIcon, CheckCircleIcon, ArrowRightIcon, DownloadIcon, PrintIcon, CopyIcon } from './icons.tsx';

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
        khutbah1.verses,
        khutbah1.tafsir,
        khutbah1.reflections,
        ...khutbah1.messages.map(item => `${item.message}\n${item.explanation}`),
        khutbah1.repentance,
        khutbah2.hadith.text,
        khutbah2.hadithReflection,
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
                  <Section title="الآيات المعتمدة"><p className="text-xl leading-loose font-amiri text-gray-800 text-center bg-white p-4 rounded-md shadow-sm">{sermon.khutbah1.verses}</p></Section>
                  <Section title="تفسير لطيف"><p className="text-lg leading-relaxed text-gray-700">{sermon.khutbah1.tafsir}</p></Section>
                  <Section title="تأملات عميقة"><p className="text-lg leading-relaxed text-gray-700">{sermon.khutbah1.reflections}</p></Section>
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
                  <Section title="دعوة للاستغفار والتوبة"><p className="text-lg leading-relaxed text-gray-700 italic">{sermon.khutbah1.repentance}</p></Section>
              </div>
              
              <div className="p-6 border border-gray-200 rounded-lg bg-gray-50/50">
                  <h2 className="text-3xl font-bold font-amiri text-center text-teal-900 mb-6">الخطبة الثانية</h2>
                  <Section title="حديث نبوي">
                      <div className="bg-white p-4 rounded-md shadow-sm">
                          <p className="text-lg leading-relaxed font-semibold text-gray-800">{sermon.khutbah2.hadith.text}</p>
                          <p className="text-sm text-gray-500 mt-2 text-start pt-2 border-t border-gray-100"><span className="font-bold">درجة الحديث:</span> {sermon.khutbah2.hadith.authenticity}</p>
                      </div>
                  </Section>
                  <Section title="تأمل في الحديث"><p className="text-lg leading-relaxed text-gray-700">{sermon.khutbah2.hadithReflection}</p></Section>
                  <Section title="دعاء ختامي"><p className="text-lg leading-loose text-gray-700">{sermon.khutbah2.dua}</p></Section>
              </div>
              
              <div className="text-center text-xl font-bold text-teal-800 py-4 mt-8">... وأقم الصلاة</div>
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
                إنشاء نص للنسخ
            </button>
          </div>
        ) : (
          <div className="p-4 border border-gray-300 rounded-lg bg-gray-50/50">
              <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-800">نص الخطبة جاهز للنسخ</h4>
                  <button 
                      onClick={handleCopyToClipboard} 
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:bg-teal-400 transition-all"
                  >
                      <CopyIcon className="w-5 h-5"/>
                      <span>{copyButtonText}</span>
                  </button>
              </div>
              <textarea
                  readOnly
                  className="w-full h-80 p-3 border border-gray-200 rounded-md bg-white font-amiri text-lg leading-loose resize-y"
                  value={copyableText}
                  dir="rtl"
              />
          </div>
        )}
      </div>

    </div>
  );
};
