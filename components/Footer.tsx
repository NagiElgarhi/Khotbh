
import React from 'react';
import { RomanTempleIcon, WhatsAppIcon } from './icons';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-teal-800 text-gray-200 p-4 mt-12 w-full">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4 text-center">
        
        <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-4">
          <div className="flex items-center gap-3">
            <RomanTempleIcon className="w-10 h-10 text-teal-300" />
            <div className="font-cinzel text-2xl text-white font-bold tracking-wider">
              <span>Nagi</span>
              <span 
                className="inline-block text-4xl"
                style={{ 
                    background: 'linear-gradient(to top, #f97316, #fcd34d)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    verticalAlign: 'middle',
                }}
              >
                Z
              </span>
              <span> Smart Solutions</span>
            </div>
          </div>
          <p className="font-cinzel text-teal-200 text-2xl font-bold">NSS - 2025 &copy;</p>
        </div>

        <div className="border-t border-teal-700/50 w-full max-w-md my-1"></div>

        <div>
          <a
            href="https://wa.me/201066802250"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-lg text-green-300 hover:text-white transition-colors"
          >
            <WhatsAppIcon className="w-6 h-6" />
            <span className="font-semibold">تواصل معنا عبر واتساب</span>
            <span className="font-mono tracking-wider" dir="ltr">002-010-6680-2250</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
