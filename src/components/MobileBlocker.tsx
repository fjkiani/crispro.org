import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function MobileBlocker() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check immediately
    checkMobile();
    
    // Add listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center overscroll-none touch-none">
      <div className="bg-rose-500/20 text-rose-500 w-20 h-20 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle size={40} strokeWidth={2.5} />
      </div>
      <h1 className="text-2xl font-black mb-4 uppercase tracking-[0.2em]">Mobile Detected</h1>
      <p className="text-slate-300 text-base leading-relaxed font-medium max-w-sm">
        warning: site is not optimized for mobile - mobile detected. Close and use Laptop/PC
      </p>
    </div>
  );
}
