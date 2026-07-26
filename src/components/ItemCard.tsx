import React, { useState } from "react";
import {
  Copy,
  Check,
  Download,
  Eye,
  RefreshCw,
  Edit3,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { BulkItem } from "../types";
import { downloadSingleItemZip } from "../lib/zipHelper";

interface ItemCardProps {
  item: BulkItem;
  onRegenerateImage: (item: BulkItem) => void;
  onRegenerateCaption: (item: BulkItem) => void;
  onOpenFbPreview: (item: BulkItem) => void;
  onOpenEditModal: (item: BulkItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onRegenerateImage,
  onRegenerateCaption,
  onOpenFbPreview,
  onOpenEditModal,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCaption = () => {
    if (!item.caption) return;
    navigator.clipboard.writeText(item.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    downloadSingleItemZip(item);
  };

  const wordCount = item.wordCount || 0;
  const isWordCountValid = wordCount >= 200 && wordCount <= 400;

  return (
    <div
      id={`item-card-${item.id}`}
      className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm space-y-4"
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <span className="bg-slate-900 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-sm">
            #{String(item.index + 1).padStart(2, "0")}
          </span>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-tight font-mono text-ellipsis overflow-hidden max-w-[200px] sm:max-w-xs">
              {item.filenameBase}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {item.status === "completed" && (
            <span className="inline-flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Asset Pair Generated</span>
            </span>
          )}

          {item.status === "generating-image" && (
            <span className="inline-flex items-center space-x-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating AI Image...</span>
            </span>
          )}

          {item.status === "generating-caption" && (
            <span className="inline-flex items-center space-x-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Generating FB Caption...</span>
            </span>
          )}

          {item.status === "idle" && (
            <span className="inline-flex items-center space-x-1 bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
              In Queue
            </span>
          )}

          {item.status === "error" && (
            <span className="inline-flex items-center space-x-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Generation Error</span>
            </span>
          )}
        </div>
      </div>

      {/* Prompt Text */}
      <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 text-xs text-slate-800">
        <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block mb-1">
          Prompt Specification
        </span>
        <p className="font-medium text-slate-700 leading-relaxed">{item.prompt}</p>
      </div>

      {/* Main Content Layout: Image + Caption */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Image Preview */}
        <div className="lg:col-span-5 space-y-2">
          <div className="relative aspect-square w-full bg-slate-900 border border-slate-200 rounded-sm overflow-hidden flex items-center justify-center group">
            {item.imageUrl ? (
              <>
                <img
                  src={item.imageUrl}
                  alt={item.prompt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[10px] font-mono px-2 py-0.5 rounded-xs border border-slate-700">
                  {item.filenameBase}.png
                </div>
              </>
            ) : item.status === "generating-image" ? (
              <div className="flex flex-col items-center justify-center space-y-2 text-blue-400 p-4 text-center">
                <RefreshCw className="w-7 h-7 animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider">Rendering Image...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 text-slate-500 p-4 text-center">
                <ImageIcon className="w-8 h-8 opacity-40" />
                <span className="text-xs font-mono">asset_pending.png</span>
              </div>
            )}
          </div>

          {/* Single Image Action */}
          {item.imageUrl && (
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => onRegenerateImage(item)}
                className="text-slate-500 hover:text-blue-600 flex items-center space-x-1 cursor-pointer font-semibold transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate Image</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: FB Caption */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Facebook Post Caption
                </span>
              </div>

              {/* Word Count Indicator */}
              {item.caption && (
                <div
                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
                    isWordCountValid
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-amber-50 border-amber-200 text-amber-700"
                  }`}
                >
                  {wordCount} Words {isWordCountValid ? "✓ (200-400 Target)" : "(Target: 200-400)"}
                </div>
              )}
            </div>

            {/* Caption Text Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 text-xs text-slate-700 font-sans leading-relaxed min-h-[180px] max-h-[260px] overflow-y-auto space-y-2 whitespace-pre-line">
              {item.caption ? (
                item.caption
              ) : item.status === "generating-caption" ? (
                <div className="flex flex-col items-center justify-center py-10 text-blue-600 space-y-2">
                  <Sparkles className="w-6 h-6 animate-spin" />
                  <span className="font-bold text-xs uppercase tracking-wider">Drafting 200–400 word Facebook caption...</span>
                </div>
              ) : (
                <span className="text-slate-400 italic font-mono text-xs">
                  caption_pending.txt
                </span>
              )}
            </div>
          </div>

          {/* Item Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
            <div className="flex items-center space-x-2 text-xs">
              {item.caption && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-sm transition cursor-pointer font-semibold"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Caption</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenFbPreview(item)}
                    className="flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-sm transition cursor-pointer font-bold"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>FB Live Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenEditModal(item)}
                    className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-sm transition cursor-pointer font-medium"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                </>
              )}
            </div>

            {item.status === "completed" && (
              <button
                type="button"
                onClick={handleDownloadSingle}
                className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-sm text-xs font-bold tracking-wide transition cursor-pointer border-b-2 border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Pair (.png + .txt)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {item.error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-sm flex items-center space-x-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Error: {item.error}</span>
        </div>
      )}
    </div>
  );
};
