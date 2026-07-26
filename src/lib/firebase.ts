import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  deleteDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { BulkItem, GenerationSettings } from "../types";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate Connection to Firestore on startup
 */
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

/**
 * Login with Google Popup
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
}

/**
 * Sign Out
 */
export async function logOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign-Out Error:", error);
    throw error;
  }
}

/**
 * Listen to Auth State changes
 */
export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Firestore Posts Realtime Subscription
 */
export function subscribeUserPosts(userId: string, onNext: (items: BulkItem[]) => void) {
  const path = "posts";
  const q = query(collection(db, path), where("userId", "==", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const posts: BulkItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: data.id || d.id,
          index: data.index ?? 0,
          prompt: data.prompt || "",
          status: data.status || "idle",
          error: data.error,
          imageUrl: data.imageUrl,
          caption: data.caption,
          wordCount: data.wordCount,
          filenameBase: data.filenameBase || `post_${d.id}`,
        };
      });
      // Sort by index
      posts.sort((a, b) => a.index - b.index);
      onNext(posts);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Save or Update a Post Item in Cloud
 */
export async function savePostToCloud(userId: string, item: BulkItem) {
  const path = `posts/${item.id}`;
  try {
    const postRef = doc(db, "posts", item.id);
    const payload: Record<string, any> = {
      id: item.id,
      userId,
      index: item.index,
      prompt: item.prompt,
      status: item.status,
      filenameBase: item.filenameBase,
      updatedAt: new Date().toISOString(),
    };

    if (item.error) payload.error = item.error;
    if (item.imageUrl) payload.imageUrl = item.imageUrl;
    if (item.caption) payload.caption = item.caption;
    if (item.wordCount !== undefined) payload.wordCount = item.wordCount;

    await setDoc(postRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a Single Post from Cloud
 */
export async function deletePostFromCloud(postId: string) {
  const path = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, "posts", postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Clear All User Posts from Cloud
 */
export async function clearUserPostsFromCloud(userId: string, items: BulkItem[]) {
  const path = "posts";
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const ref = doc(db, "posts", item.id);
      batch.delete(ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save User Preference Settings
 */
export async function saveUserSettingsToCloud(userId: string, settings: GenerationSettings) {
  const path = `settings/${userId}`;
  try {
    await setDoc(doc(db, "settings", userId), {
      userId,
      tone: settings.tone,
      language: settings.language,
      style: settings.style,
      aspectRatio: settings.aspectRatio,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load User Preference Settings
 */
export async function loadUserSettingsFromCloud(userId: string): Promise<GenerationSettings | null> {
  const path = `settings/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, "settings", userId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        tone: data.tone,
        language: data.language,
        style: data.style,
        aspectRatio: data.aspectRatio,
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}
