const DATABASE_NAME = "iinkts-sessions"
const DATABASE_VERSION = 1
const ENTRIES = "entries"
const SYMBOLS = "symbols"
const SNAPSHOTS = "snapshots"
const LEASES = "leases"

/**
 * A session saved in the browser: what one canvas wrote while the page was open.
 * @group Manager
 */
export type TSavedSessionInfo = {
  id: string
  /** Document it belongs to, see `configuration.persistence.key` */
  key: string
  createdAt: number
  updatedAt: number
  symbolCount: number
  /** Characters stored, symbols and snapshot */
  size: number
}

type TEntry = Omit<TSavedSessionInfo, "size"> & { symbolsSize: number; snapshotSize: number }

/**
 * A lease on a document key, for browsers without Web Locks
 * @group Manager
 */
export type TSessionLease = { key: string; owner: string; expiresAt: number }

const toInfo = ({ symbolsSize, snapshotSize, ...info }: TEntry): TSavedSessionInfo => ({
  ...info,
  size: symbolsSize + snapshotSize,
})

const requestResult = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error ?? new Error("Session storage transaction aborted"))
  })

/** Writes `data` in `store` and updates the entry, in one transaction */
function writeEntry(
  database: IDBDatabase,
  store: typeof SYMBOLS | typeof SNAPSHOTS,
  { id, key, data, now }: { id: string; key: string; data: string; now: number },
  update: (entry: TEntry) => TEntry
): Promise<void> {
  const transaction = database.transaction([ENTRIES, store], "readwrite")
  const entries = transaction.objectStore(ENTRIES)
  const previous = entries.get(id)
  previous.onsuccess = () => {
    const entry: TEntry = previous.result ?? {
      id,
      key,
      createdAt: now,
      updatedAt: now,
      symbolCount: 0,
      symbolsSize: 0,
      snapshotSize: 0,
    }
    entries.put(update({ ...entry, updatedAt: now }))
    transaction.objectStore(store).put({ id, data })
  }
  return transactionDone(transaction)
}

/**
 * The sessions saved in the browser, in IndexedDB: per entry its metadata, its symbols (written on
 * every change) and its last snapshot (symbols and server package, written less often) — three
 * stores, so writing the symbols does not write the snapshot again.
 * @group Manager
 */
export class SessionStorage {
  #database?: Promise<IDBDatabase>

  constructor(protected factory: IDBFactory = indexedDB) {}

  protected get database(): Promise<IDBDatabase> {
    this.#database ??= new Promise((resolve, reject) => {
      const request = this.factory.open(DATABASE_NAME, DATABASE_VERSION)
      request.onupgradeneeded = () => {
        const database = request.result
        database.createObjectStore(ENTRIES, { keyPath: "id" }).createIndex("key", "key")
        database.createObjectStore(SYMBOLS, { keyPath: "id" })
        database.createObjectStore(SNAPSHOTS, { keyPath: "id" })
        database.createObjectStore(LEASES, { keyPath: "key" })
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    return this.#database
  }

  async writeSymbols(write: {
    id: string
    key: string
    symbols: string
    symbolCount: number
    now: number
  }): Promise<void> {
    const { symbols, symbolCount } = write
    return writeEntry(await this.database, SYMBOLS, { ...write, data: symbols }, (entry) => ({
      ...entry,
      symbolCount,
      symbolsSize: symbols.length,
    }))
  }

  async writeSnapshot(write: { id: string; key: string; snapshot: string; now: number }): Promise<void> {
    return writeEntry(await this.database, SNAPSHOTS, { ...write, data: write.snapshot }, (entry) => ({
      ...entry,
      snapshotSize: write.snapshot.length,
    }))
  }

  /** The entries of a document, most recently written first */
  async list(key: string): Promise<TSavedSessionInfo[]> {
    const index = (await this.database).transaction(ENTRIES).objectStore(ENTRIES).index("key")
    const entries: TEntry[] = await requestResult(index.getAll(key))
    return entries.map(toInfo).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async read(id: string): Promise<{ symbols: string; snapshot?: string } | undefined> {
    const transaction = (await this.database).transaction([SYMBOLS, SNAPSHOTS])
    const [symbols, snapshot]: ({ data: string } | undefined)[] = await Promise.all([
      requestResult(transaction.objectStore(SYMBOLS).get(id)),
      requestResult(transaction.objectStore(SNAPSHOTS).get(id)),
    ])
    return symbols && { symbols: symbols.data, snapshot: snapshot?.data }
  }

  async delete(id: string): Promise<void> {
    return this.deleteAll([id])
  }

  protected async deleteAll(ids: string[]): Promise<void> {
    const transaction = (await this.database).transaction([ENTRIES, SYMBOLS, SNAPSHOTS], "readwrite")
    ids.forEach((id) => [ENTRIES, SYMBOLS, SNAPSHOTS].forEach((store) => transaction.objectStore(store).delete(id)))
    return transactionDone(transaction)
  }

  /**
   * Deletes, across documents, the entries not written for longer than `maxAge`, then the oldest
   * ones beyond `maxSize` characters in all. `keep`, the entry being written, always stays.
   */
  async purge({
    maxAge,
    maxSize,
    now,
    keep,
  }: {
    maxAge: number
    maxSize: number
    now: number
    keep?: string
  }): Promise<void> {
    const entries: TEntry[] = await requestResult(
      (await this.database).transaction(ENTRIES).objectStore(ENTRIES).getAll()
    )
    let total = 0
    const purged = entries
      .map(toInfo)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .filter((entry) => {
        total += entry.size
        return entry.id !== keep && (now - entry.updatedAt > maxAge || total > maxSize)
      })
      .map((entry) => entry.id)
    if (purged.length) {
      await this.deleteAll(purged)
    }
  }

  /**
   * Takes or extends the lease on `key` for `owner`, unless another owner holds it unexpired.
   * @returns whether `owner` holds it
   */
  async acquireLease({
    key,
    owner,
    now,
    duration,
  }: {
    key: string
    owner: string
    now: number
    duration: number
  }): Promise<boolean> {
    const transaction = (await this.database).transaction(LEASES, "readwrite")
    const leases = transaction.objectStore(LEASES)
    let acquired = false
    const current = leases.get(key)
    current.onsuccess = () => {
      const lease: TSessionLease | undefined = current.result
      acquired = !lease || lease.owner === owner || lease.expiresAt <= now
      if (acquired) {
        leases.put({ key, owner, expiresAt: now + duration } satisfies TSessionLease)
      }
    }
    await transactionDone(transaction)
    return acquired
  }

  async releaseLease(key: string, owner: string): Promise<void> {
    const transaction = (await this.database).transaction(LEASES, "readwrite")
    const leases = transaction.objectStore(LEASES)
    const current = leases.get(key)
    current.onsuccess = () => {
      if ((current.result as TSessionLease | undefined)?.owner === owner) {
        leases.delete(key)
      }
    }
    return transactionDone(transaction)
  }

  close(): void {
    void this.#database?.then((database) => database.close())
    this.#database = undefined
  }
}
