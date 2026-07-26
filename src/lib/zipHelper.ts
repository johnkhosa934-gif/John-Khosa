import JSZip from "jszip";
import { BulkItem } from "../types";

/**
 * Converts a data URL or remote image URL to a Blob or ArrayBuffer for JSZip
 */
async function fetchImageAsBlob(url: string): Promise<Blob> {
  if (url.startsWith("data:")) {
    const res = await fetch(url);
    return await res.blob();
  }
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  return await response.blob();
}

/**
 * Downloads a ZIP containing all generated images and captions with matching filenames.
 * E.g.
 * - post_01_a_serene_sunset.png
 * - post_01_a_serene_sunset.txt
 * - post_02_cyberpunk_neon_city.png
 * - post_02_cyberpunk_neon_city.txt
 */
export async function downloadBulkZip(
  items: BulkItem[],
  zipFilename: string = "bulk_posts_images_and_captions.zip",
  onProgress?: (percent: number) => void
): Promise<void> {
  const completedItems = items.filter(
    (item) => item.status === "completed" && item.imageUrl && item.caption
  );

  if (completedItems.length === 0) {
    throw new Error("No completed post items available to zip.");
  }

  const zip = new JSZip();
  const folderName = "bulk_fb_posts";
  const folder = zip.folder(folderName) || zip;

  let processed = 0;
  const total = completedItems.length;

  let readmeText = `=======================================================\n`;
  readmeText += `BULK IMAGE & FB CAPTION EXPORT SUMMARY\n`;
  readmeText += `Generated on: ${new Date().toLocaleString()}\n`;
  readmeText += `Total Posts: ${completedItems.length}\n`;
  readmeText += `=======================================================\n\n`;

  for (const item of completedItems) {
    const baseName = item.filenameBase;
    const imgFileName = `${baseName}.png`;
    const txtFileName = `${baseName}.txt`;

    readmeText += `POST #${item.index + 1}:\n`;
    readmeText += `Filename Pair: ${imgFileName} & ${txtFileName}\n`;
    readmeText += `Prompt: ${item.prompt}\n`;
    readmeText += `Caption Word Count: ${item.wordCount || 0} words\n`;
    readmeText += `-------------------------------------------------------\n\n`;

    // Add TXT Caption
    const formattedCaption = `${item.caption}\n\n--- Prompt: ${item.prompt} ---`;
    folder.file(txtFileName, formattedCaption);

    // Add PNG Image
    try {
      const imgBlob = await fetchImageAsBlob(item.imageUrl!);
      folder.file(imgFileName, imgBlob);
    } catch (err) {
      console.error(`Error embedding image for ${baseName}:`, err);
      folder.file(`${baseName}_image_error.txt`, `Could not embed image: ${String(err)}`);
    }

    processed++;
    if (onProgress) {
      onProgress(Math.round((processed / total) * 100));
    }
  }

  folder.file("README_SUMMARY.txt", readmeText);

  // Generate ZIP
  const blob = await zip.generateAsync({ type: "blob" }, (metadata) => {
    if (onProgress) {
      onProgress(Math.round(metadata.percent));
    }
  });

  // Trigger Download
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Downloads a single pair (image + txt) zipped or as individual files
 */
export async function downloadSingleItemZip(item: BulkItem): Promise<void> {
  if (!item.imageUrl || !item.caption) return;

  const zip = new JSZip();
  const baseName = item.filenameBase;
  const imgFileName = `${baseName}.png`;
  const txtFileName = `${baseName}.txt`;

  zip.file(txtFileName, item.caption);

  try {
    const imgBlob = await fetchImageAsBlob(item.imageUrl);
    zip.file(imgFileName, imgBlob);
  } catch (err) {
    console.error("Failed image fetch:", err);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${baseName}_pair.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
