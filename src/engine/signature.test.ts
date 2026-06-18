import { test } from "node:test";
import assert from "node:assert/strict";

import { IDLE_SIGNATURE, signatureConfig } from "./signature.ts";

test("signatureConfig names each sub-industry's bet (the noun + commit verb)", () => {
  assert.equal(signatureConfig("frontier_model_lab").noun, "training run");
  assert.equal(signatureConfig("launch_services").noun, "launch");
  assert.equal(signatureConfig("ai_chips").noun, "fab tape-out");
  assert.equal(signatureConfig("satellite_constellations").noun, "deployment batch");
  assert.equal(signatureConfig("space_stations").noun, "tenant build-out");
  assert.ok(signatureConfig("frontier_model_lab").commitVerb.length > 0);
});

test("an unknown sub-industry falls back to the default config", () => {
  assert.equal(signatureConfig("nope").noun, signatureConfig("frontier_model_lab").noun);
});

test("IDLE_SIGNATURE is the idle placeholder the company starts with", () => {
  assert.equal(IDLE_SIGNATURE.status, "idle");
});
