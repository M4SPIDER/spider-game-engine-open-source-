/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — Store storage on the device (IndexedDB)
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 *
 * Published games and the Studio screenshot tray live here, so publishing needs no server.
 * localStorage holds about 5 MB for the whole app (projects and chats too); IndexedDB does not run out
 * after a few games. When IndexedDB is unavailable (some private windows) a memory map keeps the session working.
 */
const NAME = "spider-store";
const mem = { games: new Map(), shots: new Map() };
let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("games")) db.createObjectStore("games", { keyPath: "slug" });
        if (!db.objectStoreNames.contains("shots")) db.createObjectStore("shots", { keyPath: "id" }).createIndex("projectId", "projectId");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbp;
}

const wrap = (req) => new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });

export async function dbAll(store) {
  const db = await open();
  if (!db) return [...mem[store].values()];
  return wrap(db.transaction(store).objectStore(store).getAll());
}
export async function dbGet(store, key) {
  const db = await open();
  if (!db) return mem[store].get(key) || null;
  return (await wrap(db.transaction(store).objectStore(store).get(key))) || null;
}
export async function dbPut(store, value) {
  const db = await open();
  const key = store === "games" ? value.slug : value.id;
  if (!db) { mem[store].set(key, value); return; }
  await new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error || new Error("This device has no room left. Free some space and try again."));
  });
}
export async function dbDelete(store, key) {
  const db = await open();
  if (!db) { mem[store].delete(key); return; }
  await new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
}
