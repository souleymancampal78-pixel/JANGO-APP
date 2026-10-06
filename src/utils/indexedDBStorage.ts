/**
 * IndexedDB storage utility for JANGO
 * Enables complete offline caching of AI chat sessions, responses, and dictionary entries.
 */
import { ChatSession, DictionaryEntry } from '../types';

const DB_NAME = 'jangoia_offline_db';
const DB_VERSION = 1;

const STORES = {
  SESSIONS: 'sessions',
  DICTIONARY: 'dictionary_cache',
} as const;

let dbInstance: IDBDatabase | null = null;

export const initIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non supporté par ce navigateur'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Object store for Chat Sessions
      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        const sessionStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
        sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Object store for Dictionary Lookups
      if (!db.objectStoreNames.contains(STORES.DICTIONARY)) {
        db.createObjectStore(STORES.DICTIONARY, { keyPath: 'word' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error("Erreur d'ouverture d'IndexedDB:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

/**
 * Persist all sessions to IndexedDB for offline access
 */
export const saveSessionsToIDB = async (sessions: ChatSession[]): Promise<void> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SESSIONS, 'readwrite');
      const store = tx.objectStore(STORES.SESSIONS);

      // Clear existing to avoid orphaned sessions after deletions
      store.clear();

      sessions.forEach((session) => {
        store.put(session);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Impossible de sauvegarder dans IndexedDB, repli sur localStorage:', err);
  }
};

/**
 * Retrieve all sessions from IndexedDB
 */
export const getSessionsFromIDB = async (): Promise<ChatSession[] | null> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SESSIONS, 'readonly');
      const store = tx.objectStore(STORES.SESSIONS);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result as ChatSession[];
        if (result && Array.isArray(result) && result.length > 0) {
          // Sort by updatedAt descending
          result.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Erreur de lecture IndexedDB:', err);
    return null;
  }
};

/**
 * Clear all sessions from IndexedDB
 */
export const clearSessionsFromIDB = async (): Promise<void> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SESSIONS, 'readwrite');
      const store = tx.objectStore(STORES.SESSIONS);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Erreur de suppression IndexedDB:', err);
  }
};

/**
 * Cache dictionary entry in IndexedDB
 */
export const cacheDictionaryWord = async (entry: DictionaryEntry): Promise<void> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DICTIONARY, 'readwrite');
      const store = tx.objectStore(STORES.DICTIONARY);
      const normalizedKey = entry.word.toLowerCase().trim();
      store.put({ ...entry, word: normalizedKey });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Erreur mise en cache dictionnaire:', err);
  }
};

/**
 * Get cached dictionary word from IndexedDB
 */
export const getCachedDictionaryWord = async (word: string): Promise<DictionaryEntry | null> => {
  try {
    const db = await initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DICTIONARY, 'readonly');
      const store = tx.objectStore(STORES.DICTIONARY);
      const normalizedKey = word.toLowerCase().trim();
      const request = store.get(normalizedKey);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Erreur lecture dictionnaire IndexedDB:', err);
    return null;
  }
};
