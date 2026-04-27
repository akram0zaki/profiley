import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 22+ ships an experimental `localStorage` global that conflicts with the
// one jsdom provides under Vitest, leaving the global without `.clear` /
// `.getItem` methods. Force a clean in-memory polyfill so tests can rely on
// the standard Web Storage API.
function installLocalStoragePolyfill() {
  const store = new Map<string, string>();
  const stub: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: stub,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: stub,
    });
  }
}
installLocalStoragePolyfill();

// Default Vite env values so `import.meta.env.VITE_*` reads have something
// stable to return under jsdom.
const env = (import.meta as any).env ?? {};
env.VITE_SUPABASE_URL ??= 'http://localhost:54321';
env.VITE_SUPABASE_PUBLISHABLE_KEY ??= 'test-anon-key';
env.VITE_SUPABASE_FUNCTIONS_URL ??= 'http://localhost:54321/functions/v1';

// jsdom < 26 didn't ship crypto.randomUUID — provide a deterministic fallback.
if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.randomUUID !== 'function') {
  (globalThis as any).crypto = {
    ...(globalThis as any).crypto,
    randomUUID: () => '00000000-0000-4000-8000-000000000000',
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  installLocalStoragePolyfill();
});

