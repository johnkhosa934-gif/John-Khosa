import React, { useState } from "react";
import { Sparkles, ListPlus, Wand2, RefreshCw, Trash2, HelpCircle, Square } from "lucide-react";
import { SAMPLE_PROMPTS } from "../lib/utils";

interface PromptInputSectionProps {
  onStartBulk: (prompts: string[]) => void;
  isGenerating: boolean;
  onStopGeneration?: () => void;
}

export const PromptInputSection: React.FC<PromptInputSectionProps> = ({
  onStartBulk,
  isGenerating,
  onStopGeneration,
}) => {
  const [inputMode, setInputMode] = useState<"manual" | "ai">("manual");
  const [manualText, setManualText] = useState<string>(
    SAMPLE_PROMPTS.slice(0, 3).join("\n")
  );

  // AI Niche Generator States
  const [nicheTopic, setNicheTopic] = useState<string>("");
  const [promptCount, setPromptCount] = useState<number>(5);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Clean lines for manual text
  const manualLines = manualText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const handleStartManual = () => {
    if (manualLines.length === 0) return;
    onStartBulk(manualLines);
  };

  const handleGenerateAiPrompts = async () => {
    if (!nicheTopic.trim()) return;
    setIsGeneratingPrompts(true);
    setAiError(null);

    try {
      const response = await fetch("/api/generate-batch-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nicheTopic: nicheTopic.trim(), count: promptCount }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate prompts.");
      }

      if (Array.isArray(data.prompts) && data.prompts.length > 0) {
        setManualText(data.prompts.join("\n"));
        setInputMode("manual");
      } else {
        throw new Error("No prompts returned from AI generator.");
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to generate AI prompts.");
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleLoadSamples = () => {
    setManualText(SAMPLE_PROMPTS.join("\n"));
  };

  const handleClear = () => {
    setManualText("");
  };

  return (
    <div id="prompt-input-section" className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm space-y-4">
      {/* Mode Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <ListPlus className="w-4 h-4 text-blue-600" />
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Bulk Prompt Queue
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            (1 Line = 1 Image + 1 FB Caption)
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => setInputMode("manual")}
            className={`px-3 py-1 rounded-xs transition-all ${
              inputMode === "manual"
                ? "bg-white text-blue-600 font-bold shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Line-by-Line Queue ({manualLines.length})
          </button>
          <button
            type="button"
            onClick={() => setInputMode("ai")}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-xs transition-all ${
              inputMode === "ai"
                ? "bg-white text-blue-600 font-bold shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Idea Generator</span>
          </button>
        </div>
      </div>

      {/* Manual Input Tab */}
      {inputMode === "manual" && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              id="bulk-prompts-textarea"
              rows={6}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Enter your prompts here (One prompt per line)...&#10;Example 1: Modern minimalist architecture in desert sunset, ultra-realistic&#10;Example 2: A cozy rustic coffee shop interior with warm wooden tables&#10;Example 3: Futuristic neon cyberpunk city street at dusk"
              className="w-full bg-slate-50 border border-slate-200 rounded-sm p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono leading-relaxed"
            />
            <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-sm border border-slate-200">
              {manualLines.length} PROMPT{manualLines.length === 1 ? "" : "S"}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center space-x-2 text-xs">
              <button
                type="button"
                onClick={handleLoadSamples}
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-semibold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Insert Sample Prompts</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-500 hover:text-rose-600 flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {isGenerating && onStopGeneration ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="flex items-center space-x-2 px-6 py-3 rounded-sm font-bold tracking-wide text-xs bg-rose-600 hover:bg-rose-700 text-white border-b-2 border-rose-800 active:border-b-0 cursor-pointer shadow-sm animate-pulse"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>STOP GENERATION</span>
                </button>
              ) : (
                <button
                  id="start-bulk-btn"
                  type="button"
                  onClick={handleStartManual}
                  disabled={manualLines.length === 0 || isGenerating}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-sm font-bold tracking-wide text-xs transition-colors border-b-2 shadow-sm ${
                    manualLines.length > 0 && !isGenerating
                      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-800 active:border-b-0 cursor-pointer"
                      : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isGenerating
                      ? "GENERATING BATCH..."
                      : `START GENERATION (${manualLines.length} ITEM${
                          manualLines.length === 1 ? "" : "S"
                        })`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Niche Generator Tab */}
      {inputMode === "ai" && (
        <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 border border-blue-200 rounded-sm text-blue-600">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Generate Prompts By Niche / Theme
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your niche (e.g. "Luxury Real Estate", "Fitness Motivation", "Cozy Coffee Shops") and Gemini will construct image + post prompts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Niche Topic / Product Name
              </label>
              <input
                type="text"
                value={nicheTopic}
                onChange={(e) => setNicheTopic(e.target.value)}
                placeholder="e.g. Organic Skincare & Wellness"
                className="w-full bg-white border border-slate-200 rounded-sm px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Batch Size
              </label>
              <select
                value={promptCount}
                onChange={(e) => setPromptCount(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-sm px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value={3}>3 Prompts</option>
                <option value={5}>5 Prompts</option>
                <option value={8}>8 Prompts</option>
                <option value={10}>10 Prompts</option>
              </select>
            </div>
          </div>

          {aiError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-sm p-2.5 text-xs font-medium">
              {aiError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerateAiPrompts}
              disabled={!nicheTopic.trim() || isGeneratingPrompts}
              className={`flex items-center space-x-2 px-5 py-2 rounded-sm text-xs font-bold tracking-wide transition-colors ${
                nicheTopic.trim() && !isGeneratingPrompts
                  ? "bg-slate-900 text-white hover:bg-slate-800 border-b-2 border-slate-700 cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isGeneratingPrompts ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>BRAINSTORMING PROMPTS...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>CREATE PROMPT BATCH</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
