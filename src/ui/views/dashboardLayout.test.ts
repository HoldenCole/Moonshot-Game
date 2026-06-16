import { test } from "node:test";
import assert from "node:assert/strict";

import { applyVisibleOrder, effectiveOrder, moveBefore, swap } from "./dashboardLayout.ts";

const KNOWN = ["financials", "signature", "captable", "fundraising"];

test("effectiveOrder keeps the saved order, drops unknowns, appends new panels", () => {
  // A clean saved order is preserved as-is.
  assert.deepEqual(effectiveOrder(["captable", "financials", "signature", "fundraising"], KNOWN), [
    "captable",
    "financials",
    "signature",
    "fundraising",
  ]);
  // Empty (first run) → the canonical order.
  assert.deepEqual(effectiveOrder([], KNOWN), KNOWN);
  // A stale id is dropped; a panel missing from the save is appended at the end.
  assert.deepEqual(effectiveOrder(["captable", "removed_panel", "signature"], KNOWN), [
    "captable",
    "signature",
    "financials",
    "fundraising",
  ]);
});

test("moveBefore drops the item in just ahead of the target", () => {
  assert.deepEqual(moveBefore(KNOWN, "fundraising", "financials"), [
    "fundraising",
    "financials",
    "signature",
    "captable",
  ]);
  // Moving onto itself or an absent target is a no-op (fresh copy).
  assert.deepEqual(moveBefore(KNOWN, "signature", "signature"), KNOWN);
  assert.deepEqual(moveBefore(KNOWN, "signature", "ghost"), KNOWN);
});

test("swap nudges an item up/down and clamps at the ends", () => {
  assert.deepEqual(swap(KNOWN, "signature", -1), ["signature", "financials", "captable", "fundraising"]);
  assert.deepEqual(swap(KNOWN, "signature", 1), ["financials", "captable", "signature", "fundraising"]);
  assert.deepEqual(swap(KNOWN, "financials", -1), KNOWN); // already first
  assert.deepEqual(swap(KNOWN, "fundraising", 1), KNOWN); // already last
});

test("applyVisibleOrder writes the visible sequence back, pinning hidden panels", () => {
  // signature is hidden (slot 1). Reordering the three visible panels must leave
  // signature anchored at index 1.
  const order = ["financials", "signature", "captable", "fundraising"];
  const hidden = ["signature"];
  const visible = order.filter((id) => !hidden.includes(id)); // financials, captable, fundraising
  const reordered = moveBefore(visible, "fundraising", "financials"); // fundraising, financials, captable
  assert.deepEqual(applyVisibleOrder(order, hidden, reordered), [
    "fundraising",
    "signature", // still pinned at slot 1
    "financials",
    "captable",
  ]);
});
