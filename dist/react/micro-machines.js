import { useState as i, useEffect as u, useCallback as h } from "react";
import { State as g, StateMachine as v, createMachine as k, runMachine as p } from "../micro-machines.js";
const l = (a) => {
  const [t, s] = i(), [r, n] = i({
    context: void 0,
    state: void 0
  });
  console.log("use machine hook"), u(() => {
    const e = a();
    return e.onStateChanged(({ state: o, context: d }) => {
      n({ state: o, context: { ...d } });
    }), s(e), () => {
      e.clearListeners(), s(void 0);
    };
  }, [a]);
  const c = h(
    (e) => {
      console.log("Calling start from React hook with", e), t == null || t.start(e).catch((o) => {
        throw o;
      });
    },
    [t]
  );
  return {
    ...r,
    ready: t !== void 0,
    start: c,
    success: (t == null ? void 0 : t.success) === !0,
    terminated: (t == null ? void 0 : t.terminated) === !0
  };
}, f = (a, t) => {
  const { start: s, state: r, context: n, ready: c, success: e, terminated: o } = l(a);
  return u(() => {
    c && s(t);
  }, [c, s, t]), {
    state: r,
    context: n,
    success: e,
    terminated: o
  };
};
export {
  g as State,
  v as StateMachine,
  k as createMachine,
  p as runMachine,
  f as useAutoStartingMachine,
  l as useMachine
};
