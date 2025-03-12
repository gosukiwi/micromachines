import { useState as n, useEffect as u, useCallback as S } from "react";
import { State as p, StateMachine as v, compose as l, createMachine as y } from "../micro-machines.js";
const f = (s) => {
  const [t, r] = n(), [c, a] = n({
    context: void 0,
    state: void 0
  });
  u(() => {
    const e = s();
    return e.onStateChanged(({ state: i, context: d }) => {
      a({ state: i, context: { ...d } });
    }), r(e), () => {
      e.clearListeners(), r(void 0);
    };
  }, [s]);
  const o = S(() => {
    t == null || t.start().catch((e) => {
      throw e;
    });
  }, [t]);
  return {
    ...c,
    ready: t !== void 0,
    start: o,
    success: (t == null ? void 0 : t.success) === !0,
    terminated: (t == null ? void 0 : t.terminated) === !0
  };
}, x = (s) => {
  const { start: t, state: r, context: c, ready: a, success: o, terminated: e } = f(s);
  return u(() => {
    a && t();
  }, [a, t]), {
    state: r,
    context: c,
    success: o,
    terminated: e
  };
};
export {
  p as State,
  v as StateMachine,
  l as compose,
  y as createMachine,
  x as useAutoStartingMachine,
  f as useMachine
};
