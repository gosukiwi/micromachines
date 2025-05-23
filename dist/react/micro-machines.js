import { useState as u, useEffect as i, useCallback as S } from "react";
import { State as l, StateMachine as m, createMachine as p, runMachine as y } from "../micro-machines.js";
const h = (a) => {
  const [t, s] = u(), [n, o] = u({
    context: void 0,
    state: void 0
  });
  i(() => {
    const e = a();
    return e.onStateChanged(({ state: r, context: d }) => {
      o({ state: r, context: { ...d } });
    }), s(e), () => {
      e.clearListeners(), s(void 0);
    };
  }, [a]);
  const c = S(
    (e) => {
      t == null || t.start(e).catch((r) => {
        throw r;
      });
    },
    [t]
  );
  return {
    ...n,
    ready: t !== void 0,
    start: c,
    success: (t == null ? void 0 : t.success) === !0,
    terminated: (t == null ? void 0 : t.terminated) === !0
  };
}, f = (a, t) => {
  const { start: s, state: n, context: o, ready: c, success: e, terminated: r } = h(a);
  return i(() => {
    c && s(t);
  }, [c, s]), {
    state: n,
    context: o,
    success: e,
    terminated: r
  };
};
export {
  l as State,
  m as StateMachine,
  p as createMachine,
  y as runMachine,
  f as useAutoStartingMachine,
  h as useMachine
};
