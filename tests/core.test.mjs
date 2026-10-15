import test from "node:test";
import assert from "node:assert/strict";
import {
  clockMinutes,
  nightMinutes,
  createDemoNights,
  summarizeNights,
  validateNights,
  initialState,
  validateState,
  importWorkspace,
  makeMemory,
  insight,
} from "../src/core.mjs";
test("two seven-night windows handle midnight and produce the documented 50-minute shift", () => {
  const s = summarizeNights(createDemoNights());
  assert.equal(s.bedtimeDelta, 50);
  assert.equal(s.wakeDelta, 0);
  assert.equal(s.latest.sleepMinutes, 402);
  assert.equal(s.count, 14);
  assert.equal(nightMinutes("00:10") - nightMinutes("23:50"), 20);
});
test("short series does not claim a longitudinal comparison", () =>
  assert.equal(
    summarizeNights(createDemoNights().slice(0, 6)).bedtimeDelta,
    null,
  ));
test("invalid data is rejected before it reaches the UI", () => {
  for (const value of ["24:00", "7:00", "23:60", null])
    assert.throws(() => clockMinutes(value));
  assert.throws(() => validateNights([]));
  assert.throws(() =>
    validateNights([{ ...createDemoNights()[0], date: "2026-02-30" }]),
  );
  assert.throws(() =>
    validateNights([{ ...createDemoNights()[0], sleepMinutes: 999 }]),
  );
  assert.throws(() =>
    validateNights([createDemoNights()[0], createDemoNights()[0]]),
  );
});
test("import sorts nights and strips unexpected fields", () => {
  const source = createDemoNights()
    .reverse()
    .map((n) => ({ ...n, secret: "not retained" }));
  const result = importWorkspace(source);
  assert.equal(result.nights[0].date, "2026-10-01");
  assert.equal(result.nights[0].secret, undefined);
  assert.equal(result.memories.length, 0);
});
test("memory corrections survive export and deleted records stay deleted", () => {
  const state = initialState();
  state.memories[0] = makeMemory("demo-1", "My schedule has changed.");
  const restored = validateState(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.memories[0].text, "My schedule has changed.");
  restored.memories = [];
  assert.deepEqual(validateState(restored).memories, []);
  assert.throws(() => makeMemory("a", " "));
  assert.throws(() => makeMemory("a", "x".repeat(241)));
});
test("untrusted workspace fields and duplicate IDs cannot be restored", () => {
  const state = initialState();
  assert.throws(() => validateState({ ...state, context: "injected" }));
  assert.throws(() => validateState({ ...state, schemaVersion: 999 }));
  assert.throws(() =>
    validateState({
      ...state,
      memories: [state.memories[0], state.memories[0]],
    }),
  );
});
test("context changes the next step without claiming medical inference", () => {
  const state = initialState();
  assert.match(insight(state).context, /cannot tell me why/);
  state.context = "difficulty";
  assert.match(insight(state).context, /qualified healthcare professional/);
  state.context = "changed";
  assert.match(insight(state).context, /no longer/);
  state.context = "work";
  assert.match(insight(state).context, /does not establish a cause/);
});
