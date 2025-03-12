var d = Object.defineProperty;
var u = (n, t, e) => t in n ? d(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var s = (n, t, e) => u(n, typeof t != "symbol" ? t + "" : t, e);
class f {
  constructor(t, e) {
    s(this, "name");
    s(this, "onEnter");
    this.name = t, this.onEnter = e;
  }
  async emitOnEnter(t) {
    this.onEnter !== void 0 && await this.onEnter(t);
  }
  get isTerminal() {
    return this.onEnter === void 0;
  }
}
class S {
  constructor({
    initial: t,
    final: e,
    context: i
  }) {
    s(this, "context");
    s(this, "states");
    s(this, "initial");
    s(this, "final");
    s(this, "currentState");
    s(this, "onStateChangedCallback");
    s(this, "onTerminatedCallback");
    s(this, "history");
    this.initial = t, this.final = e, this.context = i, this.states = [], this.history = [];
  }
  addState(t) {
    this.states.push(t);
  }
  async start(t) {
    await this.transition(this.initial, t);
  }
  async transition(t, e) {
    var r;
    const i = this.getState(t);
    if (i.name === ((r = this.currentState) == null ? void 0 : r.name))
      throw new Error(`Already in ${t}`);
    this.history.push(t), e !== void 0 && (this.context = { ...this.context, ...e }), this.currentState = i, this.onStateChangedCallback !== void 0 && this.onStateChangedCallback({ state: t, context: this.context }), this.currentState.isTerminal ? this.onTerminatedCallback !== void 0 && this.onTerminatedCallback({
      state: this.currentState.name,
      context: this.context
    }) : await this.currentState.emitOnEnter(this.context);
  }
  onStateChanged(t) {
    this.onStateChangedCallback = t;
  }
  getState(t) {
    const e = this.states.find((i) => i.name === t);
    if (e === void 0) throw new Error(`Invalid state: ${t}`);
    return e;
  }
  onTerminated(t) {
    this.onTerminatedCallback = t;
  }
  get success() {
    return this.currentState === void 0 ? !1 : this.final.includes(this.currentState.name);
  }
  get terminated() {
    var t;
    return ((t = this.currentState) == null ? void 0 : t.isTerminal) === !0;
  }
  clearListeners() {
    this.onStateChangedCallback = void 0, this.onTerminatedCallback = void 0;
  }
}
function g(...n) {
  if (n.length < 2)
    throw new Error("At least two machines are required.");
  let t = n.reduce(
    // @ts-expect-error - This is fine because we're merging the context
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (a, o) => ({ ...a, ...o.context }),
    {}
  ), e = !1, i, r;
  return n.forEach((a, o) => {
    a.onStateChanged(({ state: c, context: l }) => {
      t = { ...t, ...l }, i && i({ state: c, context: t });
    }), a.onTerminated(({ state: c, context: l }) => {
      if (t = { ...t, ...l }, o < n.length - 1 && a.success) {
        n[o + 1].start().catch((h) => {
          throw h;
        });
        return;
      }
      e = !0, r && r({ state: c, context: t });
    });
  }), {
    context: t,
    async start(a) {
      e = !1, n.length > 0 && await n[0].start(a);
    },
    get success() {
      return n.every((a) => a.success);
    },
    onStateChanged(a) {
      i = a;
    },
    onTerminated(a) {
      r = a;
    },
    clearListeners() {
      i = void 0, r = void 0;
    },
    get terminated() {
      return e;
    }
  };
}
const w = (n) => {
  const e = n(async (r, a) => {
    await i.transition(r, a);
  }), i = new S({
    initial: e.initial,
    final: Array.isArray(e.final) ? e.final : [e.final],
    context: e.context
  });
  return Object.entries(e.states).forEach(([r, a]) => {
    const o = new f(
      r,
      a
    );
    i.addState(o);
  }), i;
};
export {
  f as State,
  S as StateMachine,
  g as compose,
  w as createMachine
};
