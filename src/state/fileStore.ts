/**
 * Selected document files live in memory only — they are never written to
 * localStorage or IndexedDB, so nothing survives a refresh or leaves the tab.
 */
const files = new Map<string, File>()

export const rememberFile = (key: string, file: File) => files.set(key, file)
export const recallFile = (key: string): File | null => files.get(key) ?? null
export const forgetFile = (key: string) => files.delete(key)
export const forgetAllFiles = () => files.clear()

/** Removes data saved by the earlier Education Loan builds of this prototype. */
export function purgeLegacyStorage() {
  try {
    window.localStorage.removeItem('instingloan:prototype:v1')
    window.localStorage.removeItem('instingloan:prototype:v2')
    window.indexedDB?.deleteDatabase('instingloan-prototype')
  } catch {
    /* nothing to clean up */
  }
}
