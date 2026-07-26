import React from "react";
import { Image as ImageIcon, FileText, Download, Square, LogIn, LogOut, User as UserIcon, Cloud } from "lucide-react";
import { User } from "firebase/auth";

interface HeaderProps {
  completedCount: number;
  totalCount: number;
  isGenerating: boolean;
  onDownloadZip: () => void;
  onStopGeneration?: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  completedCount,
  totalCount,
  isGenerating,
  onDownloadZip,
  onStopGeneration,
  user,
  onSignIn,
  onSignOut,
}) => {
  return (
    <header id="main-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Title & Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center shadow-sm">
            <div className="w-4 h-4 bg-white rounded-xs"></div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                BulkGen <span className="text-blue-600">Pro</span>
              </h1>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1">
                <Cloud className="w-3 h-3 text-blue-500" />
                <span>Firebase Sync</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              One Prompt = 1 AI Image + 200–400 Word FB Caption (.ZIP Export)
            </p>
          </div>
        </div>

        {/* Action Header Stats, Auth & Quick Export */}
        <div className="flex items-center space-x-3">
          {isGenerating && onStopGeneration && (
            <button
              id="header-stop-btn"
              onClick={onStopGeneration}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white border-b-2 border-rose-800 active:border-b-0 cursor-pointer shadow-sm animate-pulse"
              title="Stop current batch execution"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP BATCH</span>
            </button>
          )}

          {/* Auth Button */}
          {user ? (
            <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-sm pl-2 pr-1.5 py-1">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "User"} className="w-5 h-5 rounded-full" />
              ) : (
                <UserIcon className="w-4 h-4 text-slate-600" />
              )}
              <span className="text-xs font-semibold text-slate-700 max-w-[100px] truncate hidden sm:inline">
                {user.displayName || user.email?.split("@")[0]}
              </span>
              <button
                onClick={onSignOut}
                className="p-1 hover:bg-slate-200 rounded-xs text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-sm text-xs font-bold cursor-pointer transition shadow-xs"
              title="Sign in with Google to sync queue with Cloud Firestore"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600" />
              <span>Sign In</span>
            </button>
          )}

          <div className="hidden lg:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              System Status
            </span>
            <span className={`text-xs font-medium flex items-center space-x-1.5 ${isGenerating ? "text-blue-600" : "text-emerald-600"}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isGenerating ? "bg-blue-500" : "bg-emerald-500"}`}></span>
              <span>{isGenerating ? "Generating..." : "Engines Ready"}</span>
            </span>
          </div>

          {totalCount > 0 && (
            <div className="hidden md:flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-sm px-3 py-1.5 text-xs font-mono">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-400">+</span>
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-slate-700">
                {completedCount} / {totalCount} Ready
              </span>
            </div>
          )}

          <button
            id="header-download-zip-btn"
            onClick={onDownloadZip}
            disabled={completedCount === 0 || isGenerating}
            className={`flex items-center space-x-2 px-4 py-2 rounded-sm text-xs font-bold tracking-wide transition-colors border-b-2 ${
              completedCount > 0 && !isGenerating
                ? "bg-slate-900 text-white hover:bg-slate-800 border-slate-700 active:border-b-0 cursor-pointer shadow-sm"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT ALL (.ZIP) {completedCount > 0 && `(${completedCount})`}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
