export function mergeNotifications(previous, items, newIds) {
  const previousById = new Map(previous.map((item) => [item.id, item]));
  return items.map((item) => {
    const existing = previousById.get(item.id);
    return {
      ...item,
      read: existing?.read ?? item.read ?? Boolean(item.read_at),
      isNew: newIds.has(item.id) || Boolean(existing?.isNew),
    };
  });
}

export function scheduleNewHighlight(id, timers, onExpire, schedule = setTimeout) {
  const timer = schedule(() => {
    timers.delete(id);
    onExpire(id);
  }, 4000);
  timers.set(id, timer);
}
