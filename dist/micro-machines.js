var c = Object.defineProperty;
var h = (a, t, i) => t in a ? c(a, t, { enumerable: !0, configurable: !0, writable: !0, value: i }) : a[t] = i;
var n = (a, t, i) => h(a, typeof t != "symbol" ? t + "" : t, i);
class l {
  constructor(t, i) {
    n(this, "name");
    n(this, "onEnter");
    this.name = t, this.onEnter = i;
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
    final: i,
    context: e
  }) {
    n(this, "context");
    n(this, "states");
    n(this, "initial");
    n(this, "final");
    n(this, "currentState");
    n(this, "onStateChangedCallback");
    n(this, "onTerminatedCallback");
    n(this, "history");
    this.initial = t, this.final = i, this.context = e, this.states = [], this.history = [];
  }
  addState(t) {
    this.states.push(t);
  }
  async start(t) {
    await this.transition(this.initial, t);
  }
  async transition(t, i) {
    var s;
    const e = this.getState(t);
    if (e.name === ((s = this.currentState) == null ? void 0 : s.name))
      throw new Error(`Already in ${t}`);
    this.history.push(t), i !== void 0 && (this.context = { ...this.context, ...i }), this.currentState = e, this.onStateChangedCallback !== void 0 && this.onStateChangedCallback({ state: t, context: this.context }), this.currentState.isTerminal ? this.onTerminatedCallback !== void 0 && this.onTerminatedCallback({
      state: this.currentState.name,
      context: this.context
    }) : await this.currentState.emitOnEnter(this.context);
  }
  onStateChanged(t) {
    this.onStateChangedCallback = t;
  }
  getState(t) {
    const i = this.states.find((e) => e.name === t);
    if (i === void 0) throw new Error(`Invalid state: ${t}`);
    return i;
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
const S = (a) => {
  const i = a(async (s, r) => {
    await e.transition(s, r);
  }), e = new d({
    initial: i.initial,
    final: Array.isArray(i.final) ? i.final : [i.final],
    context: i.context
  });
  return Object.entries(i.states).forEach(([s, r]) => {
    const o = new l(
      s,
      r
    );
    e.addState(o);
  }), e;
};
export {
  l as State,
  d as StateMachine,
  S as createMachine
};
