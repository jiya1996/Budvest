'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-200 font-sans">
      <div className="w-full max-w-md h-[100dvh] md:h-[844px] bg-slate-50 shadow-2xl md:rounded-[40px] overflow-hidden md:border-[8px] md:border-slate-800 relative flex flex-col">
        {/* Status Bar (仅桌面模拟) */}
        <div className="hidden md:flex h-12 w-full justify-between items-center px-6 pt-2 z-50 bg-white/80 backdrop-blur-sm sticky top-0">
          <span className="text-sm font-semibold text-slate-900">9:41</span>
          <div className="flex gap-1.5">
            <div className="w-4 h-4 rounded-full border border-slate-800 opacity-40"></div>
            <div className="w-6 h-4 rounded-[4px] border border-slate-800 bg-slate-800/80"></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <WifiOff size={40} className="text-slate-400" />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-2">网络连接已断开</h1>
          <p className="text-slate-500 text-center mb-8">
            请检查您的网络连接后重试
          </p>

          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors active:scale-95"
          >
            <RefreshCw size={18} />
            重新连接
          </button>

          <div className="mt-12 text-center">
            <p className="text-slate-400 text-sm">伴投 Investbuddy</p>
            <p className="text-slate-300 text-xs mt-1">你的投资心理陪伴伙伴</p>
          </div>
        </div>

        {/* Home Indicator (仅桌面模拟) */}
        <div className="hidden md:block absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-800 rounded-full opacity-20 z-50"></div>
      </div>
    </div>
  );
}
