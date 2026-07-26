import React from "react";
import { Sliders, Sparkles, Globe, Palette, Maximize2 as AspectIcon, FileCheck } from "lucide-react";
import { GenerationSettings, CaptionTone, CaptionLanguage, ImageStyle, AspectRatio } from "../types";

interface SettingsPanelProps {
  settings: GenerationSettings;
  onChange: (newSettings: GenerationSettings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onChange }) => {
  const tones: CaptionTone[] = [
    "Engaging",
    "Storytelling",
    "Inspirational",
    "Promotional",
    "Educational",
    "Humorous",
  ];

  const languages: CaptionLanguage[] = [
    "English",
    "Roman Urdu",
    "Urdu",
    "Hindi",
    "Bilingual (Eng/Urdu)",
  ];

  const styles: ImageStyle[] = [
    "Photorealistic",
    "Cinematic",
    "Digital Art",
    "3D Render",
    "Minimalist",
    "Vintage",
  ];

  const aspectRatios: { value: AspectRatio; label: string }[] = [
    { value: "1:1", label: "1:1 (Square FB Post)" },
    { value: "4:3", label: "4:3 (Standard Photo)" },
    { value: "16:9", label: "16:9 (Landscape Banner)" },
    { value: "9:16", label: "9:16 (Story / Reel)" },
  ];

  return (
    <div id="settings-panel" className="bg-white border border-slate-200 rounded-sm p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            FB Caption & Image Configurations
          </h2>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-sm font-medium">
          <FileCheck className="w-3.5 h-3.5" />
          <span>Strict 200–400 Word Target</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Caption Tone */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Caption Tone</span>
          </label>
          <select
            value={settings.tone}
            onChange={(e) => onChange({ ...settings, tone: e.target.value as CaptionTone })}
            className="w-full bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {tones.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Caption Language */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Language</span>
          </label>
          <select
            value={settings.language}
            onChange={(e) => onChange({ ...settings, language: e.target.value as CaptionLanguage })}
            className="w-full bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Image Style */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span>Image Visual Style</span>
          </label>
          <select
            value={settings.style}
            onChange={(e) => onChange({ ...settings, style: e.target.value as ImageStyle })}
            className="w-full bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {styles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <AspectIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>Aspect Ratio</span>
          </label>
          <select
            value={settings.aspectRatio}
            onChange={(e) => onChange({ ...settings, aspectRatio: e.target.value as AspectRatio })}
            className="w-full bg-slate-50 border border-slate-200 rounded-sm px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {aspectRatios.map((ar) => (
              <option key={ar.value} value={ar.value}>
                {ar.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
