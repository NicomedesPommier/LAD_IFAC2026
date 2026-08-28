import { useCallback, useEffect, useRef } from "react";

/**
 * Stable onChange notifier for ReactFlow nodes.
 *
 * ReactFlow re-creates `data.onChange` on every graph update, which would
 * break `useCallback` dependency arrays in nodes that build a `notify(updates)`
 * helper. This hook holds the latest `data.onChange` in a ref and returns a
 * stable function:
 *
 *   const notify = useNotifier(id, data, () => ({
 *     inputType: "pidError",
 *     nodeName, measuredTopic, setpointMode, ...
 *   }));
 *
 *   // somewhere in an onChange:
 *   setNodeName(v); notify({ nodeName: v });
 *
 * The `buildBase` callback returns the full data snapshot to merge with
 * the per-call `updates` — pass a function that closes over current state.
 * The hook re-derives `notify` only when the *snapshot itself* changes (via
 * JSON identity of the base), so consumers get fresh closures only when
 * something they care about actually moved.
 */
export default function useNotifier(id, data, buildBase) {
  const onChangeRef = useRef(data.onChange);
  useEffect(() => {
    onChangeRef.current = data.onChange;
  }, [data.onChange]);

  const baseRef = useRef(buildBase);
  baseRef.current = buildBase;

  return useCallback(
    (updates) => {
      onChangeRef.current?.(id, { ...baseRef.current(), ...updates });
    },
    [id]
  );
}
