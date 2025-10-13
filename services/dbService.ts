
import type { Persona, ConversationHistory } from '../types';

const DB_NAME = 'OuijaDB';
const DB_VERSION = 1;
const PERSONAS_STORE = 'personas';
const CONVERSATIONS_STORE = 'conversations';
const STATE_STORE = 'app_state';

const ALL_PERSONAS_KEY = 'all_personas';
const ACTIVE_PERSONA_ID_KEY = 'active_persona_id';

let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(new Error('Error opening DB'));
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PERSONAS_STORE)) {
        db.createObjectStore(PERSONAS_STORE);
      }
      if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
        db.createObjectStore(CONVERSATIONS_STORE);
      }
       if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE);
      }
    };
  });
  return dbPromise;
};

const getStore = (storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> => {
    return initDB().then(db => {
        const transaction = db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    });
};

const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const savePersonas = async (personas: Persona[]): Promise<void> => {
    const store = await getStore(PERSONAS_STORE, 'readwrite');
    await promisifyRequest(store.put(personas, ALL_PERSONAS_KEY));
};

export const getPersonas = async (): Promise<Persona[] | null> => {
    const store = await getStore(PERSONAS_STORE, 'readonly');
    const personas = await promisifyRequest(store.get(ALL_PERSONAS_KEY));
    return (personas as Persona[] | undefined) || null;
};

export const saveConversation = async (personaId: string, history: ConversationHistory): Promise<void> => {
    const store = await getStore(CONVERSATIONS_STORE, 'readwrite');
    await promisifyRequest(store.put(history, personaId));
};

export const getConversation = async (personaId: string): Promise<ConversationHistory> => {
    const store = await getStore(CONVERSATIONS_STORE, 'readonly');
    const history = await promisifyRequest(store.get(personaId));
    return (history as ConversationHistory | undefined) || [];
};

export const clearConversation = async (personaId: string): Promise<void> => {
    const store = await getStore(CONVERSATIONS_STORE, 'readwrite');
    await promisifyRequest(store.delete(personaId));
};

export const setActivePersonaId = async (personaId: string): Promise<void> => {
    const store = await getStore(STATE_STORE, 'readwrite');
    await promisifyRequest(store.put(personaId, ACTIVE_PERSONA_ID_KEY));
};

export const getActivePersonaId = async (): Promise<string | null> => {
    const store = await getStore(STATE_STORE, 'readonly');
    const id = await promisifyRequest(store.get(ACTIVE_PERSONA_ID_KEY));
    return (id as string | undefined) || null;
};
