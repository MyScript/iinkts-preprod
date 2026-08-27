import { SymbolStore, type TBaseSymbol } from "@/iink"

type TRecord = TBaseSymbol & { label?: string }

const build = (id: string, label = id): TRecord => ({
  id,
  creationTime: 0,
  modificationDate: 0,
  type: "test",
  style: {},
  label,
})

const ids = (store: SymbolStore<TRecord>) => store.list().map((s) => s.id)

describe("SymbolStore", () => {
  describe("add", () => {
    test("should hold what was added", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      expect(store.get("a")?.label).toEqual("a")
      expect(store.size).toEqual(1)
    })

    test("should throw on a duplicate id rather than silently replacing", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      expect(() => store.add(build("a"))).toThrow("Symbol id already exist: a")
    })

    test("should bump the version", () => {
      const store = new SymbolStore<TRecord>()
      const before = store.version
      store.add(build("a"))
      expect(store.version).toBeGreaterThan(before)
    })
  })

  describe("update", () => {
    test("should replace the record under the same id", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a", "before"))
      store.update(build("a", "after"))
      expect(store.get("a")?.label).toEqual("after")
    })

    test("should ignore an unknown id", () => {
      const store = new SymbolStore<TRecord>()
      store.update(build("ghost"))
      expect(store.size).toEqual(0)
    })

    test("should not bump the version when markDirty is false", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      const before = store.version
      store.update(build("a", "quiet"), false)
      expect(store.version).toEqual(before)
      expect(store.get("a")?.label).toEqual("quiet")
    })
  })

  describe("remove", () => {
    test("should drop the record and bump the version", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      const before = store.version
      store.remove("a")
      expect(store.get("a")).toBeUndefined()
      expect(store.version).toBeGreaterThan(before)
    })

    test("should not bump the version for an unknown id", () => {
      const store = new SymbolStore<TRecord>()
      const before = store.version
      store.remove("ghost")
      expect(store.version).toEqual(before)
    })
  })

  describe("replace", () => {
    test("should swap one record for several, in place", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      store.add(build("b"))
      store.add(build("c"))
      store.replace("b", [build("b1"), build("b2")])
      expect(store.list().map((s) => s.id)).toEqual(["a", "c", "b1", "b2"])
    })

    test("should do nothing for an unknown id", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      const before = store.version
      store.replace("ghost", [build("x")])
      expect(store.list().map((s) => s.id)).toEqual(["a"])
      expect(store.version).toEqual(before)
    })
  })

  describe("list", () => {
    test("should keep insertion order", () => {
      const store = new SymbolStore<TRecord>()
      ;["a", "b", "c"].forEach((id) => store.add(build(id)))
      expect(store.list().map((s) => s.id)).toEqual(["a", "b", "c"])
    })

    test("should hand out the stored records themselves, not copies", () => {
      const store = new SymbolStore<TRecord>()
      const record = build("a")
      store.add(record)
      expect(store.list()[0]).toBe(record)
      expect(store.get("a")).toBe(record)
    })
  })

  describe("changeOrder", () => {
    const seed = () => {
      const store = new SymbolStore<TRecord>()
      ;["a", "b", "c", "d"].forEach((id) => store.add(build(id)))
      return store
    }

    test("should move to first", () => {
      const store = seed()
      store.changeOrder("c", "first")
      expect(ids(store)).toEqual(["c", "a", "b", "d"])
    })

    test("should move to last", () => {
      const store = seed()
      store.changeOrder("b", "last")
      expect(ids(store)).toEqual(["a", "c", "d", "b"])
    })

    test("should move forward by one", () => {
      const store = seed()
      store.changeOrder("b", "forward")
      expect(ids(store)).toEqual(["a", "c", "b", "d"])
    })

    test("should move backward by one", () => {
      const store = seed()
      store.changeOrder("c", "backward")
      expect(ids(store)).toEqual(["a", "c", "b", "d"])
    })

    test("should be a no-op at the edges", () => {
      const store = seed()
      store.changeOrder("a", "backward")
      store.changeOrder("d", "forward")
      expect(ids(store)).toEqual(["a", "b", "c", "d"])
    })

    test("should ignore an unknown id without bumping the version", () => {
      const store = seed()
      const before = store.version
      store.changeOrder("ghost", "first")
      expect(ids(store)).toEqual(["a", "b", "c", "d"])
      expect(store.version).toEqual(before)
    })

    test("should bump the version when the order actually changed", () => {
      const store = seed()
      const before = store.version
      store.changeOrder("c", "first")
      expect(store.version).toBeGreaterThan(before)
    })
  })

  describe("clear", () => {
    test("should empty the store and bump the version", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      const before = store.version
      store.clear()
      expect(store.size).toEqual(0)
      expect(store.version).toBeGreaterThan(before)
    })
  })
})
