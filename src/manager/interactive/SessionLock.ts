import { createUUID, DeferredPromise } from "@/core"

import type { SessionStorage } from "./SessionStorage"

// Long enough to outlive the throttling of a hidden tab, whose timers may run once a minute
const LEASE_DURATION = 2 * 60 * 1000
const LEASE_RENEWAL = 20 * 1000
const TAB_ID_KEY = "iinkts-session-tab"
/** This page load: a reload gets another one */
const PAGE_ID = createUUID()

/**
 * Where a lease is taken from: the tab, kept across reloads, and the page load in it
 * @group Manager
 */
export type TSessionLockContext = { tab?: string; page: string }

/** The id of this tab, kept in `sessionStorage` so that a reload finds it again */
function tabId(): string | undefined {
  try {
    const stored = globalThis.sessionStorage.getItem(TAB_ID_KEY)
    if (stored) {
      return stored
    }
    const created = createUUID()
    globalThis.sessionStorage.setItem(TAB_ID_KEY, created)
    return created
  } catch {
    // No sessionStorage: a reload waits for the lease of its previous page to expire
    return undefined
  }
}

/**
 * Makes one canvas at a time, across tabs, write a document: with Web Locks when the browser has
 * them (secure contexts), otherwise with a lease kept in IndexedDB and renewed while the canvas lives.
 * @group Manager
 */
export class SessionLock {
  #held?: DeferredPromise<void>
  #renewal?: ReturnType<typeof setInterval>
  #lease?: { key: string; owner: string }

  /**
   * @param locks - `navigator.locks`, undefined to use the lease
   * @param onLost - Called when another canvas took the lease over, after this page slept past it
   * @param context - Tab and page load the lease is taken from
   */
  constructor(
    protected storage: SessionStorage,
    protected locks: LockManager | undefined = globalThis.navigator?.locks,
    protected onLost: () => void = () => undefined,
    protected context: TSessionLockContext = { tab: tabId(), page: PAGE_ID }
  ) {}

  /** A page leaving for good releases its lease: the next page, in any tab, does not wait for it */
  protected onPageHide = (event: PageTransitionEvent): void => {
    if (!event.persisted) {
      this.release()
    }
  }

  /** @returns whether this canvas now holds the document; false when another one does */
  acquire(key: string, owner: string): Promise<boolean> {
    return this.locks ? this.acquireLock(this.locks, key) : this.acquireLease(key, owner)
  }

  protected acquireLock(locks: LockManager, key: string): Promise<boolean> {
    const acquired = new DeferredPromise<boolean>()
    const held = new DeferredPromise<void>()
    void locks.request(`iinkts-session:${key}`, { ifAvailable: true }, (lock) => {
      acquired.resolve(!!lock)
      if (!lock) {
        return undefined
      }
      this.#held = held
      return held.promise
    })
    return acquired.promise
  }

  protected async acquireLease(key: string, owner: string): Promise<boolean> {
    if (!(await this.renewLease(key, owner))) {
      return false
    }
    this.#lease = { key, owner }
    globalThis.addEventListener?.("pagehide", this.onPageHide)
    this.#renewal = setInterval(async () => {
      if (!(await this.renewLease(key, owner))) {
        this.stopRenewal()
        this.onLost()
      }
    }, LEASE_RENEWAL)
    return true
  }

  protected renewLease(key: string, owner: string): Promise<boolean> {
    return this.storage.acquireLease({ key, owner, ...this.context, now: Date.now(), duration: LEASE_DURATION })
  }

  protected stopRenewal(): void {
    globalThis.removeEventListener?.("pagehide", this.onPageHide)
    clearInterval(this.#renewal)
    this.#renewal = undefined
    this.#lease = undefined
  }

  /** Lets another canvas take the document */
  release(): void {
    this.#held?.resolve()
    this.#held = undefined
    const lease = this.#lease
    this.stopRenewal()
    if (lease) {
      void this.storage.releaseLease(lease.key, lease.owner)
    }
  }
}
