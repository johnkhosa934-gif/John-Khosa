import React from "react";
import { CheckCircle2, Clock, AlertCircle, RefreshCw, Download, Square, Trash2 } from "lucide-react";
import { BulkItem } from "../types";

interface ProgressStatsProps {
  items: BulkItem[];
  isGenerating: boolean;
  onDownloadZip: () => void;
  onClearAll: () => void;
  onRetryFailed: () => void;
  onStopGeneration?: () => void;
}

export const ProgressStats: React.FC<ProgressStatsProps> = ({
  items,
  isGenerating,
  onDownloadZip,
  onClearAll,
  onRetryFailed,
  onStopGeneration,
}) => {
  if (items.length === 0) return null;

  const total = items.length;
  const completed = items.filter((i) => i.status === "completed").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const activeCount = items.filter(
    (i) => i.status === "generating-image" || i.status === "generating-caption"
  ).length;
  const pendingCount = items.filter((i) => i.status === "idle").length;

  const percentage = Math.round((completed / total) * 100);

  return (
    <div id="progress-stats-bar" className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status Counts */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-slate-600">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Total:</span>
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-sm text-slate-800 font-bold">{total}</span>
          </div>

          <div className="flex items-center space-x-1.5 text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-slate-400 font-bold uppercase text-[10px]">Done:</span>
            <span className="font-bold">{completed}</span>
          </div>

          {activeCount > 0 && (
            <div className="flex items-center space-x-1.5 text-blue-600">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="text-slate-400 font-bold uppercase text-[10px]">Active:</span>
              <span className="font-bold">{activeCount}</span>
            </div>
          )}

          {pendingCount > 0 && (
            <div className="flex items-center space-x-1.5 text-amber-600">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-slate-400 font-bold uppercase text-[10px]">Pending:</span>
              <span className="font-bold">{pendingCount}</span>
            </div>
          )}

          {errorCount > 0 && (
            <div className="flex items-center space-x-1.5 text-rose-600">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-slate-400 font-bold uppercase text-[10px]">Errors:</span>
              <span className="font-bold">{errorCount}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {isGenerating && onStopGeneration && (
            <button
              id="stop-generation-btn"
              type="button"
              onClick={onStopGeneration}
              className="flex items-center space-x-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 border-b-2 border-rose-800 active:border-b-0 px-3 py-1 rounded-sm transition cursor-pointer shadow-sm animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP GENERATION</span>
            </button>
          )}

          {errorCount > 0 && !isGenerating && (
            <button
              type="button"
              onClick={onRetryFailed}
              className="text-xs bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 px-3 py-1 rounded-sm font-semibold transition cursor-pointer"
            >
              Retry Failed ({errorCount})
            </button>
          )}

          <button
            id="clear-queue-btn"
            type="button"
            onClick={onClearAll}
            className="flex items-center space-x-1 text-xs text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 px-3 py-1 rounded-sm font-bold transition cursor-pointer"
            title="Clear all prompts and results from queue"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR QUEUE</span>
          </button>

          <button
            id="progress-download-zip-btn"
            type="button"
            onClick={onDownloadZip}
            disabled={completed === 0 || isGenerating}
            className={`flex items-center space-x-1.5 text-xs font-bold tracking-wide px-4 py-1 rounded-sm transition-colors border-b-2 ${
              completed > 0 && !isGenerating
                ? "bg-slate-900 text-white hover:bg-slate-800 border-slate-700 cursor-pointer shadow-sm"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT ZIP ({completed})</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          <span>Queue Status</span>
          <span className="font-bold text-slate-700">{completed}/{total} Generated ({percentage}%)</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
