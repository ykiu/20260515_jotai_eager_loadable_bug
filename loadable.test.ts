import { describe, it, expect } from "vitest";
import { atom, createStore } from "jotai";
import { loadable as utilsLoadable } from "jotai/utils";
import { loadable as eagerLoadable } from "jotai-eager";

// Helper: wait for a loadable atom to leave the "loading" state.
async function waitForSettled(
  store: ReturnType<typeof createStore>,
  loadableAtom: ReturnType<typeof utilsLoadable>,
) {
  if (store.get(loadableAtom).state !== "loading") return;
  await new Promise<void>((resolve) => {
    const unsub = store.sub(loadableAtom, () => {
      if (store.get(loadableAtom).state !== "loading") {
        unsub();
        resolve();
      }
    });
  });
}

describe("loadable error recovery", () => {
  it("jotai/utils: recovers from hasError to hasData", async () => {
    const shouldThrowAtom = atom(true);
    const asyncAtom = atom(async (get) => {
      if (get(shouldThrowAtom)) throw new Error("test error");
      return "success";
    });

    const store = createStore();
    const loadableAtom = utilsLoadable(asyncAtom);
    store.sub(loadableAtom, () => {});

    await store.get(asyncAtom).catch(() => {});
    expect(store.get(loadableAtom).state).toBe("hasError");

    store.set(shouldThrowAtom, false);
    await store.get(asyncAtom);

    expect(store.get(loadableAtom).state).toBe("hasData"); // passes
  });

  it("jotai-eager: gets stuck in hasError even after error is resolved", async () => {
    const shouldThrowAtom = atom(true);
    const asyncAtom = atom(async (get) => {
      if (get(shouldThrowAtom)) throw new Error("test error");
      return "success";
    });

    const store = createStore();
    const loadableAtom = eagerLoadable(asyncAtom);
    store.sub(loadableAtom, () => {});

    await store.get(asyncAtom).catch(() => {});
    expect(store.get(loadableAtom).state).toBe("hasError");

    store.set(shouldThrowAtom, false);
    await store.get(asyncAtom);
    await waitForSettled(
      store,
      loadableAtom as ReturnType<typeof utilsLoadable>,
    );

    // Expected: "hasData" — actual: "hasError" (bug)
    expect(store.get(loadableAtom).state).toBe("hasData");
  });
});
