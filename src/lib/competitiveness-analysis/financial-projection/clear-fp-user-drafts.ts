import { workspaceScope } from "@/lib/auth/local-workspace";

const STORE_KEY_PREFIX = "k-unitrust.financial-projection.editions.v1.";
const UNI_KEY_PREFIX = "k-unitrust.financial-projection.unis.v1.";
const RUN_STORE_PREFIX = "k-unitrust.financial-projection.runs.v3.";
const PENDING_PREFIX = "k-unitrust.financial-projection.run-pending.v3.";
const IDB_NAME = "k-unitrust-fp-runs";
const IDB_STORE = "editions";

const USER_SCOPE_PREFIX = "user:";

export function clearFpUserDrafts(): void {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        (key.startsWith(STORE_KEY_PREFIX) && key.includes(USER_SCOPE_PREFIX)) ||
        (key.startsWith(UNI_KEY_PREFIX) && key.includes(USER_SCOPE_PREFIX)) ||
        (key.startsWith(RUN_STORE_PREFIX) && key.includes(USER_SCOPE_PREFIX))
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    /* private mode */
  }

  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(PENDING_PREFIX) && key.includes(USER_SCOPE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    /* private mode */
  }

  if (typeof indexedDB !== "undefined") {
    void new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.close();
          resolve();
          return;
        }
        const tx = db.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);
        const getAll = store.getAllKeys();
        getAll.onsuccess = () => {
          for (const key of getAll.result) {
            if (String(key).startsWith(USER_SCOPE_PREFIX)) {
              store.delete(key);
            }
          }
        };
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("IndexedDB clear failed"));
        };
      };
      req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    }).catch(() => {});
  }
}

export function clearFpDraftsIfUserScope(): void {
  if (workspaceScope() === "user") {
    clearFpUserDrafts();
  }
}
