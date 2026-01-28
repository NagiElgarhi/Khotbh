
import React from 'react';
import { Surah } from '../types.ts';
import { ProgressBar } from './ProgressBar.tsx';
import { BookOpenIcon, ChevronLeftIcon, ChevronRightIcon } from './icons.tsx';

interface SidebarProps {
  surahs: Surah[];
  selectedSurah: number | null;
  onSelectSurah: (surahNumber: number | null) => void;
  progress: number;
  completedCount: number;
  totalSermons: number;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  surahs,
  selectedSurah,
  onSelectSurah,
  progress,
  completedCount,
  totalSermons,
  isOpen,
  onToggle,
}) => {
  return (
    <>
      {/* Scrim for mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onToggle} aria-hidden="true"></div>}

      <aside className={`fixed top-0 start-0 z-40 w-64 h-screen bg-gray-50 border-e border-gray-200 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'rtl:translate-x-full -translate-x-full lg:translate-x-0'}`}>
        <button 
          onClick={onToggle} 
          className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full hidden lg:flex items-center justify-center text-gray-500 hover:text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-50 transition-colors shadow-md border z-50"
          aria-label={isOpen ? "إخفاء الشريط الجانبي" : "إظهار الشريط الجانبي"}
        >
          {isOpen ? <ChevronRightIcon className="w-8 h-8" /> : <ChevronLeftIcon className="w-8 h-8" />}
        </button>

        <div className="h-full flex flex-col">
          <div className="p-4 text-center border-b">
            <h2 className="text-xl font-bold text-teal-800">فهرس السور</h2>
          </div>
          
          <ProgressBar progress={progress} completedCount={completedCount} totalCount={totalSermons} />

          <nav className="flex-1 overflow-y-auto">
            <ul className="text-gray-700">
              <li
                className={`px-4 py-2 cursor-pointer flex items-center gap-3 ${selectedSurah === null ? 'bg-teal-100 text-teal-800 font-bold' : 'hover:bg-gray-100'}`}
                onClick={() => onSelectSurah(null)}
              >
                <BookOpenIcon className="w-5 h-5"/>
                <span>عرض كل الخطب</span>
              </li>
              {surahs.map((surah) => (
                <li
                  key={surah.number}
                  className={`px-4 py-2 cursor-pointer flex justify-between items-center ${selectedSurah === surah.number ? 'bg-teal-100 text-teal-800 font-bold' : 'hover:bg-gray-100'}`}
                  onClick={() => onSelectSurah(surah.number)}
                >
                  <span>{`${surah.number}. ${surah.name}`}</span>
                  <span className="text-xs font-mono text-gray-500">{surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};
