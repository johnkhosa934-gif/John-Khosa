export type CaptionTone = 
  | "Engaging" 
  | "Storytelling" 
  | "Inspirational" 
  | "Promotional" 
  | "Educational" 
  | "Humorous";

export type CaptionLanguage = 
  | "English" 
  | "Roman Urdu" 
  | "Urdu" 
  | "Hindi" 
  | "Bilingual (Eng/Urdu)";

export type ImageStyle = 
  | "Photorealistic" 
  | "Cinematic" 
  | "Digital Art" 
  | "3D Render" 
  | "Minimalist" 
  | "Vintage";

export type AspectRatio = "1:1" | "4:3" | "16:9" | "9:16";

export interface GenerationSettings {
  tone: CaptionTone;
  language: CaptionLanguage;
  style: ImageStyle;
  aspectRatio: AspectRatio;
}

export type ItemStatus = "idle" | "generating-image" | "generating-caption" | "completed" | "error";

export interface BulkItem {
  id: string;
  index: number;
  prompt: string;
  status: ItemStatus;
  error?: string;
  imageUrl?: string;
  imageSource?: string;
  caption?: string;
  wordCount?: number;
  filenameBase: string; // e.g. "post_01_cyberpunk_city"
}
