import React, { useState } from "react";
import { X, ThumbsUp, MessageSquare, Share2, Globe, MoreHorizontal, Check, Copy } from "lucide-react";
import { BulkItem } from "../types";

interface FacebookPreviewModalProps {
  item: BulkItem | null;
  onClose: () => void;
}

export const FacebookPreviewModal: React.FC<FacebookPreviewModalProps> = ({
  item,
  onClose,
}) => {
  if (!item) return null;

  const [expandedText, setExpandedText] = useState(false);
  const [copied, setCopied] = useState(false);

  const caption = item.caption || "";
  const isLongText = caption.length > 250;
  const displayedText = expandedText || !isLongText ? caption : caption.slice(0, 250) + "...";

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Facebook Post Simulation
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Post Area */}
        <div className="p-4 overflow-y-auto space-y-3 font-sans text-slate-800 bg-slate-50">
          {/* FB Post Card Container */}
          <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-xs">
            {/* FB Post Author Header */}
            <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-sm bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  FB
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>Pro Brand Page</span>
                    <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-200 px-1 py-0.2 rounded-xs font-mono uppercase">
                      Verified
                    </span>
                  </h4>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono">
                    <span>Just now</span>
                    <span>•</span>
                    <Globe className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>

              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* FB Caption Text */}
            <div className="px-3.5 py-3 text-xs leading-relaxed whitespace-pre-line text-slate-700">
              {displayedText}
              {isLongText && (
                <button
                  type="button"
                  onClick={() => setExpandedText(!expandedText)}
                  className="ml-1 text-blue-600 hover:underline font-bold cursor-pointer"
                >
                  {expandedText ? " See Less" : " See More"}
                </button>
              )}
            </div>

            {/* FB Image */}
            {item.imageUrl && (
              <div className="w-full bg-slate-900 border-y border-slate-200 max-h-[420px] overflow-hidden flex items-center justify-center">
                <img
                  src={item.imageUrl}
                  alt={item.prompt}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover max-h-[420px]"
                />
              </div>
            )}

            {/* FB Post Stats & Interaction Bar */}
            <div className="p-3 text-xs text-slate-500 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <div className="flex items-center space-x-1">
                  <span className="w-3.5 h-3.5 rounded-sm bg-blue-600 flex items-center justify-center text-white text-[8px]">
                    👍
                  </span>
                  <span>1.2K Likes</span>
                </div>
                <div className="space-x-2">
                  <span>84 Comments</span>
                  <span>•</span>
                  <span>12 Shares</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-200 text-center text-xs font-bold text-slate-700">
                <button className="flex items-center justify-center space-x-1.5 py-1.5 hover:bg-slate-100 rounded-sm transition">
                  <ThumbsUp className="w-3.5 h-3.5 text-slate-500" />
                  <span>Like</span>
                </button>
                <button className="flex items-center justify-center space-x-1.5 py-1.5 hover:bg-slate-100 rounded-sm transition">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>Comment</span>
                </button>
                <button className="flex items-center justify-center space-x-1.5 py-1.5 hover:bg-slate-100 rounded-sm transition">
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Export File Details */}
          <div className="bg-white border border-slate-200 p-3 rounded-sm flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[10px] font-bold font-mono uppercase">
                EXPORT MATCHING PAIR
              </span>
              <p className="font-mono text-blue-600 font-bold text-xs">
                {item.filenameBase}.png & {item.filenameBase}.txt
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-sm text-xs font-bold tracking-wide cursor-pointer transition border-b-2 border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPY CAPTION</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
