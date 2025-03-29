"use strict";var l=Object.defineProperty;var d=(n,t,e)=>t in n?l(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e;var s=(n,t,e)=>d(n,typeof t!="symbol"?t+"":t,e);Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});class c{constructor(t,e){s(this,"name");s(this,"onEnter");this.name=t,this.onEnter=e}async emitOnEnter(t){this.onEnter!==void 0&&await this.onEnter(t)}get isTerminal(){return this.onEnter===void 0}}class o{constructor({initial:t,final:e,context:a}){s(this,"context");s(this,"states");s(this,"initial");s(this,"final");s(this,"currentState");s(this,"onStateChangedCallback");s(this,"onTerminatedCallback");this.initial=t,this.final=e,this.context=a,this.states=[],this.onStateChangedCallback=[],this.onTerminatedCallback=[]}addState(t){this.states.push(t)}async start(t){await this.transition(this.initial,t)}async transition(t,e){var r;const a=this.getState(t);if(a.name===((r=this.currentState)==null?void 0:r.name))throw new Error(`Already in ${t}`);e!==void 0&&(this.context={...this.context,...e}),this.currentState=a,this.onStateChangedCallback.forEach(i=>{i({state:t,context:this.context})}),this.currentState.isTerminal?this.onTerminatedCallback.forEach(i=>{i({state:t,context:this.context})}):await this.currentState.emitOnEnter(this.context)}onStateChanged(t){this.onStateChangedCallback.push(t)}getState(t){const e=this.states.find(a=>a.name===t);if(e===void 0)throw new Error(`Invalid state: ${t}`);return e}onTerminated(t){this.onTerminatedCallback.push(t)}get success(){return this.currentState===void 0?!1:this.final.includes(this.currentState.name)}get terminated(){var t;return((t=this.currentState)==null?void 0:t.isTerminal)===!0}clearListeners(){this.onStateChangedCallback=[],this.onTerminatedCallback=[]}}const u=n=>{const e=n(async(r,i)=>{await a.transition(r,i)}),a=new o({initial:e.initial,final:Array.isArray(e.final)?e.final:[e.final],context:e.context});return Object.entries(e.states).forEach(([r,i])=>{const h=new c(r,i);a.addState(h)}),a},S=async({machine:n,context:t,success:e,failure:a})=>{n.onTerminated(({context:r})=>{n.success?e(r).catch(i=>{throw i}):a(r).catch(i=>{throw i})}),await n.start(t)};exports.State=c;exports.StateMachine=o;exports.createMachine=u;exports.runMachine=S;
