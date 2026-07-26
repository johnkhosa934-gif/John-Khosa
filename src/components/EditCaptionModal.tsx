import React, { useState } from "react";
import { X, Check, FileText } from "lucide-react";
import { BulkItem } from "../types";
import { countWords } from "../lib/utils";

interface EditCaptionModalProps {
  item: BulkItem | null;
  onSave: (id: string, newCaption: string) => void;
  onClose: () => void;
}

export const EditCaptionModal: React.FC<EditCaptionModalProps> = ({
  item,
  onSave,
  onClose,
}) => {
  if (!item) return null;

  const [caption, setCaption] = useState(item.caption || "");
  const wordCount = countWords(caption);
  const isValidCount = wordCount >= 200 && wordCount <= 400;

  const handleSave = () => {
    onSave(item.id, caption);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-sm shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Edit FB Caption (#{item.index + 1})
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

        {/* Textarea Area */}
        <div className="p-5 space-y-3 bg-slate-50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono text-[11px] font-bold uppercase">
              Target File: {item.filenameBase}.txt
            </span>
            <span
              className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border ${
                isValidCount
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}
            >
              {wordCount} Words {isValidCount ? "✓ (200-400)" : "(Target: 200-400)"}
            </span>
          </div>

          <textarea
            rows={12}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-sm p-3.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-5 py-3 bg-white border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-sm text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-sm text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm border-b-2 border-blue-800 active:border-b-0 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>SAVE CAPTION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
