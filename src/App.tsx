/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { Header } from "./components/Header";
import { SettingsPanel } from "./components/SettingsPanel";
import { PromptInputSection } from "./components/PromptInputSection";
import { ProgressStats } from "./components/ProgressStats";
import { ItemCard } from "./components/ItemCard";
import { FacebookPreviewModal } from "./components/FacebookPreviewModal";
import { EditCaptionModal } from "./components/EditCaptionModal";
import { BulkItem, GenerationSettings } from "./types";
import { generateFilenameBase, countWords } from "./lib/utils";
import { downloadBulkZip } from "./lib/zipHelper";
import { Layers, Sparkles, AlertCircle, FileArchive } from "lucide-react";
import {
  testFirestoreConnection,
  subscribeAuthState,
  signInWithGoogle,
  logOut,
  subscribeUserPosts,
  savePostToCloud,
  clearUserPostsFromCloud,
  saveUserSettingsToCloud,
  loadUserSettingsFromCloud,
} from "./lib/firebase";

const STORAGE_KEY_ITEMS = "bulk_fb_generator_items_v1";
const STORAGE_KEY_SETTINGS = "bulk_fb_generator_settings_v1";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<BulkItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<GenerationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      tone: "Engaging",
      language: "English",
      style: "Photorealistic",
      aspectRatio: "1:1",
    };
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedFbPreviewItem, setSelectedFbPreviewItem] = useState<BulkItem | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<BulkItem | null>(null);
  const [zipProgress, setZipProgress] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const stopRequestedRef = useRef<boolean>(false);

  // Connection test on initial mount
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeAuthState((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        showToast(`Welcome back, ${currentUser.displayName || currentUser.email}!`);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore items if user is logged in
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeUserPosts(user.uid, (cloudPosts) => {
      if (cloudPosts.length > 0) {
        setItems(cloudPosts);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Load user settings from Firestore if logged in
  useEffect(() => {
    if (!user) return;
    loadUserSettingsFromCloud(user.uid).then((cloudSettings) => {
      if (cloudSettings) {
        setSettings(cloudSettings);
      }
    });
  }, [user]);

  // Save state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to persist items:", e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn("Failed to persist settings:", e);
    }
    if (user) {
      saveUserSettingsToCloud(user.uid, settings);
    }
  }, [settings, user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      showToast("Sign-In failed: " + (err.message || "Unknown error"));
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      showToast("Signed out successfully.");
    } catch (err: any) {
      showToast("Sign-Out failed: " + (err.message || "Unknown error"));
    }
  };

  // Helper to update a specific item by ID
  const updateItem = (id: string, patch: Partial<BulkItem>) => {
    setItems((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...patch } : item));
      const updated = next.find((i) => i.id === id);
      if (updated && user) {
        savePostToCloud(user.uid, updated);
      }
      return next;
    });
  };

  // Process a single item with parallel image & caption requests for maximum speed
  const processItem = async (item: BulkItem) => {
    try {
      updateItem(item.id, { status: "generating-image", error: undefined });

      // Run image and caption generation in parallel for 2x speedup
      const imagePromise = fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: item.prompt,
          aspectRatio: settings.aspectRatio,
          style: settings.style,
        }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Image generation failed");
        return data;
      });

      const captionPromise = fetch("/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: item.prompt,
          tone: settings.tone,
          language: settings.language,
        }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Caption generation failed");
        return data;
      });

      const [imgData, capData] = await Promise.all([imagePromise, captionPromise]);

      const imageUrl = imgData.imageUrl;
      const imageSource = imgData.source;
      const caption = capData.caption;
      const wordCount = capData.wordCount || countWords(caption);

      updateItem(item.id, {
        status: "completed",
        imageUrl,
        imageSource,
        caption,
        wordCount,
      });
    } catch (err: any) {
      console.error(`Error processing item ${item.id}:`, err);
      updateItem(item.id, {
        status: "error",
        error: err.message || "Failed during bulk generation.",
      });
    }
  };

  // Start Bulk Generation Batch
  const handleStartBulk = async (prompts: string[]) => {
    if (prompts.length === 0 || isGenerating) return;

    stopRequestedRef.current = false;

    // Build new BulkItem objects
    const newItems: BulkItem[] = prompts.map((promptText, idx) => ({
      id: `item_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
      index: idx,
      prompt: promptText,
      status: "idle",
      filenameBase: generateFilenameBase(idx, promptText),
    }));

    setItems(newItems);
    setIsGenerating(true);

    showToast(`Starting bulk generation for ${newItems.length} items...`);

    // Process items in sequence to avoid rate limit spikes
    for (const item of newItems) {
      if (stopRequestedRef.current) {
        showToast("Generation stopped by user.");
        break;
      }
      await processItem(item);
      if (stopRequestedRef.current) {
        showToast("Generation stopped by user.");
        break;
      }
    }

    setIsGenerating(false);
    if (!stopRequestedRef.current) {
      showToast("Bulk batch generation complete! All matching PNG & TXT files ready.");
    }
  };

  // Stop / Cancel Generation Batch
  const handleStopGeneration = () => {
    stopRequestedRef.current = true;
    setIsGenerating(false);
    setItems((prev) =>
      prev.map((i) =>
        i.status === "idle" || i.status === "generating-image" || i.status === "generating-caption"
          ? { ...i, status: "error", error: "Generation stopped by user" }
          : i
      )
    );
    showToast("Stopped bulk generation batch!");
  };

  // Retry Failed Items
  const handleRetryFailed = async () => {
    const failedItems = items.filter((i) => i.status === "error");
    if (failedItems.length === 0 || isGenerating) return;

    stopRequestedRef.current = false;
    setIsGenerating(true);
    for (const item of failedItems) {
      if (stopRequestedRef.current) break;
      await processItem(item);
      if (stopRequestedRef.current) break;
    }
    setIsGenerating(false);
  };

  // Regenerate Single Image
  const handleRegenerateImage = async (targetItem: BulkItem) => {
    updateItem(targetItem.id, { status: "generating-image" });
    try {
      const imgRes = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: targetItem.prompt,
          aspectRatio: settings.aspectRatio,
          style: settings.style,
        }),
      });
      const imgData = await imgRes.json();
      if (!imgRes.ok) throw new Error(imgData.error || "Image failed");

      updateItem(targetItem.id, {
        status: "completed",
        imageUrl: imgData.imageUrl,
        imageSource: imgData.source,
      });
      showToast(`Regenerated image for item #${targetItem.index + 1}`);
    } catch (err: any) {
      updateItem(targetItem.id, { status: "error", error: err.message });
    }
  };

  // Regenerate Single Caption
  const handleRegenerateCaption = async (targetItem: BulkItem) => {
    updateItem(targetItem.id, { status: "generating-caption" });
    try {
      const capRes = await fetch("/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: targetItem.prompt,
          tone: settings.tone,
          language: settings.language,
        }),
      });
      const capData = await capRes.json();
      if (!capRes.ok) throw new Error(capData.error || "Caption failed");

      updateItem(targetItem.id, {
        status: "completed",
        caption: capData.caption,
        wordCount: capData.wordCount || countWords(capData.caption),
      });
      showToast(`Regenerated 200–400 word caption for item #${targetItem.index + 1}`);
    } catch (err: any) {
      updateItem(targetItem.id, { status: "error", error: err.message });
    }
  };

  // Save Edited Caption
  const handleSaveEditedCaption = (id: string, newCaption: string) => {
    updateItem(id, {
      caption: newCaption,
      wordCount: countWords(newCaption),
    });
    showToast("Caption updated!");
  };

  // Download ZIP Handler
  const handleDownloadZip = async () => {
    try {
      setZipProgress(0);
      await downloadBulkZip(items, "bulk_fb_posts_and_captions.zip", (percent) => {
        setZipProgress(percent);
      });
      showToast("ZIP Archive downloaded successfully!");
    } catch (err: any) {
      alert("ZIP Download error: " + err.message);
    } finally {
      setZipProgress(null);
    }
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to clear the prompt queue and generated posts?")) {
      if (user && items.length > 0) {
        await clearUserPostsFromCloud(user.uid, items);
      }
      setItems([]);
      localStorage.removeItem(STORAGE_KEY_ITEMS);
      showToast("Queue cleared.");
    }
  };

  const completedCount = items.filter((i) => i.status === "completed").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        completedCount={completedCount}
        totalCount={items.length}
        isGenerating={isGenerating}
        onDownloadZip={handleDownloadZip}
        onStopGeneration={handleStopGeneration}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Settings Panel */}
        <SettingsPanel settings={settings} onChange={setSettings} />

        {/* Bulk Prompt Input */}
        <PromptInputSection
          onStartBulk={handleStartBulk}
          isGenerating={isGenerating}
          onStopGeneration={handleStopGeneration}
        />

        {/* Progress & Stats Bar */}
        <ProgressStats
          items={items}
          isGenerating={isGenerating}
          onDownloadZip={handleDownloadZip}
          onClearAll={handleClearAll}
          onRetryFailed={handleRetryFailed}
          onStopGeneration={handleStopGeneration}
        />

        {/* ZIP Download Overlay Modal if compressing */}
        {zipProgress !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white border border-slate-200 rounded-sm p-6 max-w-sm w-full text-center space-y-3 shadow-2xl">
              <FileArchive className="w-10 h-10 text-blue-600 mx-auto animate-bounce" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Compressing ZIP Archive...
              </h3>
              <p className="text-xs text-slate-500">
                Pairing PNG images and TXT caption files with matching filenames.
              </p>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-blue-600 h-full transition-all duration-200"
                  style={{ width: `${zipProgress}%` }}
                />
              </div>
              <span className="text-xs font-mono text-blue-600 font-bold block">
                {zipProgress}%
              </span>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-12 right-6 z-40 bg-slate-900 text-white text-xs font-bold tracking-wide px-4 py-3 rounded-sm shadow-xl flex items-center space-x-2 border-b-2 border-blue-500 animate-fade-in">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Generated Items List */}
        {items.length > 0 ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Generated Post Batches ({items.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onRegenerateImage={handleRegenerateImage}
                  onRegenerateCaption={handleRegenerateCaption}
                  onOpenFbPreview={setSelectedFbPreviewItem}
                  onOpenEditModal={setSelectedEditItem}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white border border-dashed border-slate-300 rounded-sm p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-sm bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              No Bulk Prompts in Queue Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Enter your prompts line-by-line above or use the AI Idea Generator to brainstorm post ideas. Every prompt will create 1 AI image and 1 matching 200–400 word Facebook caption!
            </p>
          </div>
        )}
      </main>

      {/* Footer Info Bar */}
      <footer className="h-10 bg-slate-900 text-slate-400 flex items-center px-6 text-[10px] font-medium font-mono uppercase tracking-widest border-t border-slate-800">
        <div className="flex gap-6">
          <span>Engine: Gemini 2.5</span>
          <span>Target: 200–400 Word FB Posts</span>
          <span>Format: PNG + TXT (.ZIP)</span>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
          <span>Syncing local state</span>
        </div>
      </footer>

      {/* Facebook Live Post Preview Modal */}
      <FacebookPreviewModal
        item={selectedFbPreviewItem}
        onClose={() => setSelectedFbPreviewItem(null)}
      />

      {/* Edit Caption Modal */}
      <EditCaptionModal
        item={selectedEditItem}
        onSave={handleSaveEditedCaption}
        onClose={() => setSelectedEditItem(null)}
      />
    </div>
  );
}
