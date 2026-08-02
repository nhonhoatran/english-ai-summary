"use client";

import { useSyncExternalStore } from "react";

/** No external store to watch — the value only differs by render environment. */
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * `false` during SSR and the hydration pass, `true` afterwards.
 *
 * Replaces the `useState(false)` + `useEffect(() => setMounted(true), [])`
 * idiom, which triggers a cascading render and is flagged by
 * `react-hooks/set-state-in-effect`. Used to defer `createPortal` until
 * `document` exists.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
