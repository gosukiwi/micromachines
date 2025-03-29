var o = Object.defineProperty;
var h = (e, t, n) => t in e ? o(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n;
var s = (e, t, n) => h(e, typeof t != "symbol" ? t + "" : t, n);
class l {
  constructor(t, n) {
    s(this, "name");
    s(this, "onEnter");
    this.name = t, this.onEnter = n;
  }
  async emitOnEnter(t) {
    this.onEnter !== void 0 && await this.onEnter(t);
  }
  get isTerminal() {
    return this.onEnter === void 0;
  }
}
class d {
  constructor({
    initial: t,
    final: n,
    context: a
  }) {
    s(this, "context");
    s(this, "states");
    s(this, "initial");
    s(this, "final");
    s(this, "currentState");
    s(this, "onStateChangedCallback");
    s(this, "onTerminatedCallback");
    this.initial = t, this.final = n, this.context = a, this.states = [], this.onStateChangedCallback = [], this.onTerminatedCallback = [];
  }
  addState(t) {
    this.states.push(t);
  }
  async start(t) {
    await this.transition(this.initial, t);
  }
  async transition(t, n) {
    var r;
    const a = this.getState(t);
    if (a.name === ((r = this.currentState) == null ? void 0 : r.name))
      throw new Error(`Already in ${t}`);
    n !== void 0 && (this.context = { ...this.context, ...n }), this.currentState = a, this.onStateChangedCallback.forEach((i) => {
      i({ state: t, context: this.context });
    }), this.currentState.isTerminal ? this.onTerminatedCallback.forEach((i) => {
      i({
        state: t,
        context: this.context
      });
    }) : await this.currentState.emitOnEnter(this.context);
  }
  onStateChanged(t) {
    this.onStateChangedCallback.push(t);
  }
  getState(t) {
    const n = this.states.find((a) => a.name === t);
    if (n === void 0) throw new Error(`Invalid state: ${t}`);
    return n;
  }
  onTerminated(t) {
    this.onTerminatedCallback.push(t);
  }
  get success() {
    return this.currentState === void 0 ? !1 : this.final.includes(this.currentState.name);
  }
  get terminated() {
    var t;
    return ((t = this.currentState) == null ? void 0 : t.isTerminal) === !0;
  }
  clearListeners() {
    this.onStateChangedCallback = [], this.onTerminatedCallback = [];
  }
}
const f = (e) => {
  const n = e(async (r, i) => {
    await a.transition(r, i);
  }), a = new d({
    initial: n.initial,
    final: Array.isArray(n.final) ? n.final : [n.final],
    context: n.context
  });
  return Object.entries(n.states).forEach(([r, i]) => {
    const c = new l(
      r,
      i
    );
    a.addState(c);
  }), a;
}, S = async ({
  machine: e,
  context: t,
  success: n,
  failure: a
}) => {
  e.onTerminated(({ context: r }) => {
    e.success ? n(r).catch((i) => {
      throw i;
    }) : a(r).catch((i) => {
      throw i;
    });
  }), await e.start(t);
};
export {
  l as State,
  d as StateMachine,
  f as createMachine,
  S as runMachine
};
