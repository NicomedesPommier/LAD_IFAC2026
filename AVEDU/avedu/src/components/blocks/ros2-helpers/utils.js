// Shared utilities for ROS2 code generators.

export function pascalCase(name) {
  return String(name)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

export function workspaceName(canvasId) {
  return canvasId ? `ws_${canvasId.replace(/-/g, '_')}` : 'workspace';
}

// Inject a workspace namespace prefix into a topic name unless we are in QCar mode
// or the topic is already namespaced. Topics that start with `/` are treated as
// absolute and only get prefixed when they don't already live under `/{ws}/`.
export function enforceWorkspace(topic, { canvasId, isQCarMode } = {}) {
  let t = topic.startsWith('/') ? topic : '/' + topic;
  if (isQCarMode) return t;
  const ws = workspaceName(canvasId);
  if (!t.startsWith(`/${ws}/`)) {
    t = `/${ws}` + t;
  }
  return t;
}
