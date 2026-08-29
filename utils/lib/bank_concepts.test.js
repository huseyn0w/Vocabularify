import { describe, it, expect } from "vitest";
import { hasTargetWord, levelConceptsFor } from "./bank_concepts";

describe("hasTargetWord", () => {
  it("is true for the shared course (no target)", () => {
    expect(hasTargetWord({ en: "hello" }, undefined)).toBe(true);
  });

  it("is true when the target column has a word", () => {
    expect(hasTargetWord({ en: "hello", de: "Hallo" }, "de")).toBe(true);
  });

  it("is false when the target column is missing", () => {
    expect(hasTargetWord({ en: "hello", fr: "bonjour" }, "de")).toBe(false);
  });

  it("is false when the target column is an empty or blank string", () => {
    expect(hasTargetWord({ en: "hello", de: "" }, "de")).toBe(false);
    expect(hasTargetWord({ en: "hello", de: "   " }, "de")).toBe(false);
  });
});

describe("levelConceptsFor", () => {
  const conceptId = (w) => String(w).trim().toLowerCase();
  const levels = ["a1", "a2"];
  // "bonjour" (hello) was restored from a French dictionary pass with no
  // German column at all - exactly the 263-row A1 case this fix exists for.
  const banked = {
    a1: [
      { en: "hello", de: "Hallo", fr: "bonjour" },
      { en: "goodbye", fr: "au revoir" },
      { en: "water", de: "Wasser" },
    ],
    a2: [
      { en: "bread", de: "Brot" },
      { en: "milk", fr: "lait" },
    ],
  };

  it("keeps every bank row for the shared course (no target)", () => {
    const { levelConcepts } = levelConceptsFor(banked, levels, "a1", conceptId, undefined);
    expect(levelConcepts).toEqual(["hello", "goodbye", "water"]);
  });

  it("drops a row with no word in the target language", () => {
    const { levelConcepts } = levelConceptsFor(banked, levels, "a1", conceptId, "de");
    expect(levelConcepts).toEqual(["hello", "water"]);
    expect(levelConcepts).not.toContain("goodbye");
  });

  it("applies the same target filter to priorConcepts", () => {
    const { priorConcepts } = levelConceptsFor(banked, levels, "a2", conceptId, "de");
    expect(priorConcepts).toEqual(["hello", "water"]);
  });

  it("does not filter priorConcepts for the shared course", () => {
    const { priorConcepts } = levelConceptsFor(banked, levels, "a2", conceptId, undefined);
    expect(priorConcepts).toEqual(["hello", "goodbye", "water"]);
  });
});
