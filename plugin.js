// Trash Bin - best-effort task snapshot cache and deletion recorder.
const TRASH_KEY = 'trash-v1';
const CACHE_KEY = 'task-cache-v1';
let taskCache = {};
let saveQueue = Promise.resolve();

function persistCache() {
  saveQueue = saveQueue.then(async () => {
    await PluginAPI.persistDataSynced(JSON.stringify(taskCache), CACHE_KEY);
  }).catch((err) => {
    PluginAPI.showSnack({ msg: 'Trash Bin could not save its task cache.', type: 'ERROR' });
    console.error('[Trash Bin] Cache save failed', err);
  });
  return saveQueue;
}

async function refreshTaskCache() {
  try {
    const [active, archived] = await Promise.all([
      PluginAPI.getTasks(),
      PluginAPI.getArchivedTasks(),
    ]);
    for (const task of [...(active || []), ...(archived || [])]) {
      if (task && task.id) taskCache[task.id] = task;
    }
    // Bound storage and retain only recent snapshots.
    const ids = Object.keys(taskCache);
    if (ids.length > 2000) {
      for (const id of ids.slice(0, ids.length - 2000)) delete taskCache[id];
    }
    await persistCache();
  } catch (err) {
    console.error('[Trash Bin] Could not refresh task cache', err);
  }
}

async function loadTaskCache() {
  try {
    const raw = await PluginAPI.loadSyncedData(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    taskCache = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    taskCache = {};
    console.error('[Trash Bin] Cache load failed', err);
  }
}

async function recordDeletion(payload) {
  const taskId = payload && typeof payload.taskId === 'string' ? payload.taskId : (typeof payload === 'string' ? payload : null);
  if (!taskId) return;
  try {
    // Read the current UI-owned archive immediately before updating it to avoid
    // keeping a stale in-memory copy while the user removes or empties entries.
    const raw = await PluginAPI.loadSyncedData(TRASH_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const trash = Array.isArray(parsed) ? parsed : [];
    if (trash.some((entry) => entry.taskId === taskId && !entry.restored)) return;
    const snapshot = taskCache[taskId] || null;
    trash.unshift({
      entryId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      itemType: 'task',
      taskId,
      deletedAt: new Date().toISOString(),
      snapshot,
      status: snapshot ? 'recoverable' : 'snapshot-unavailable',
    });
    await PluginAPI.persistDataSynced(JSON.stringify(trash.slice(0, 500)), TRASH_KEY);
    delete taskCache[taskId];
    await persistCache();
  } catch (err) {
    console.error('[Trash Bin] Could not record task deletion', err);
    PluginAPI.showSnack({ msg: 'Trash Bin could not record a task deletion.', type: 'ERROR' });
  }
}

PluginAPI.onReady(async () => {
  await loadTaskCache();
  await refreshTaskCache();
});
PluginAPI.registerHook(PluginAPI.Hooks.TASK_CREATED, async (payload) => {
  const task = payload && payload.task;
  if (task && task.id) {
    taskCache[task.id] = task;
    await persistCache();
  }
});
PluginAPI.registerHook(PluginAPI.Hooks.TASK_UPDATE, async (payload) => {
  const task = payload && payload.task;
  if (task && task.id) {
    taskCache[task.id] = task;
    await persistCache();
  }
});
PluginAPI.registerHook(PluginAPI.Hooks.TASK_DELETE, recordDeletion);

// The manifest's iframe/sidePanel entry supplies the launcher; no additional
// header button is registered, avoiding duplicate Trash Bin icons.
