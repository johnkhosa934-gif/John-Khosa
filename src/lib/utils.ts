/**
 * Sanitizes a prompt string into a safe, matching filename base.
 * e.g., "A serene sunset over a mountain lake in spring!"
 * -> "post_01_a_serene_sunset_over_a_mountain"
 */
export function generateFilenameBase(index: number, prompt: string): string {
  const paddedIndex = String(index + 1).padStart(2, "0");
  const cleanPrompt = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join("_");

  const slug = cleanPrompt || "post";
  return `post_${paddedIndex}_${slug}`;
}

/**
 * Counts words accurately
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Sample prompt ideas for quick user testing
 */
export const SAMPLE_PROMPTS = [
  "Futuristic cyberpunk city at sunset with glowing neon billboards and flying cars",
  "A cozy rustic coffee shop interior with warm wooden tables, espresso machine, and soft morning sunlight",
  "A serene mountain lake reflecting snow-capped peaks under a golden autumn sky",
  "Healthy gourmet avocado toast garnished with microgreens and poached egg on ceramic plate",
  "Abstract 3D vibrant geometric digital artwork with smooth gradient colors and metallic reflections",
  "An adventurous hiker standing on a rocky cliff edge overlooking a misty pine forest at sunrise",
];
