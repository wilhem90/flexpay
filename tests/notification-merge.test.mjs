import assert from "node:assert/strict";
import test from "node:test";
import { mergeNotifications, scheduleNewHighlight } from "../src/components/modal/notification-merge.mjs";

test("initial notifications are not highlighted and read_at is respected", () => {
  const result = mergeNotifications([], [
    { id: "old", read_at: "2026-01-01T00:00:00Z" },
    { id: "unread", read_at: null },
  ], new Set());
  assert.deepEqual(result.map(({ read, isNew }) => ({ read, isNew })), [
    { read: true, isNew: false },
    { read: false, isNew: false },
  ]);
});

test("new highlights survive a refresh and local read state is preserved", () => {
  const initial = [{ id: "old", read: true, isNew: false }];
  const items = [{ id: "old", read_at: null }, { id: "new", read_at: null }];
  const arrived = mergeNotifications(initial, items, new Set(["new"]));
  assert.equal(arrived[0].read, true);
  assert.equal(arrived[1].isNew, true);
  const refreshed = mergeNotifications(arrived, items, new Set());
  assert.equal(refreshed[1].isNew, true);
  const expired = refreshed.map((item) => item.id === "new" ? { ...item, isNew: false } : item);
  assert.equal(mergeNotifications(expired, items, new Set())[1].isNew, false);
});

test("new highlight expires after four seconds", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const timers = new Map();
  const expired = [];
  scheduleNewHighlight("new", timers, (id) => expired.push(id));
  context.mock.timers.tick(3999);
  assert.deepEqual(expired, []);
  assert.equal(timers.size, 1);
  context.mock.timers.tick(1);
  assert.deepEqual(expired, ["new"]);
  assert.equal(timers.size, 0);
});
