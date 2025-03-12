type onEnterCallback = () => void | Promise<void>;

export class State {
  name: string;
  onEnter?: onEnterCallback;

  constructor(name: string, onEnter?: onEnterCallback) {
    this.name = name;
    this.onEnter = onEnter;
  }

  async emitOnEnter() {
    if (this.onEnter === undefined) return;
    await this.onEnter();
  }

  get isTerminal() {
    return this.onEnter === undefined;
  }
}

type MachineCallback<T> = (params: { state: string; context: T }) => void;

export interface Machine<T> {
  context: T;
  start(context?: T): Promise<void>;
  // transition(state: string, context?: T): Promise<void>;
  onStateChanged(callback: MachineCallback<T>): void;
  onTerminated(callback: MachineCallback<T>): void;
  clearListeners(): void;
  success: boolean;
  terminated: boolean;
}

export class StateMachine<T> implements Machine<T> {
  context: T;
  states: State[];
  initial: string;
  final: string[];
  currentState?: State;
  onStateChangedCallback?: (params: { state: string; context: T }) => void;
  onTerminatedCallback?: (params: { state: string; context: T }) => void;
  history: string[];

  constructor({
    initial,
    final,
    context,
  }: {
    initial: string;
    final: string[];
    context: T;
  }) {
    this.initial = initial;
    this.final = final;
    this.context = context;
    this.states = [];
    this.history = [];
  }

  addState(state: State) {
    this.states.push(state);
  }

  async start(context?: T) {
    if (this.initial === undefined)
      throw new Error("Set an initial state in order to call start");
    await this.transition(this.initial, context);
  }

  async transition(name: string, context?: T) {
    const state = this.getState(name);
    if (state.name === this.currentState?.name)
      throw new Error(`Already in ${name}`);

    this.history.push(name);

    if (context !== undefined) {
      this.context = context;
    }

    this.currentState = state;
    if (this.onStateChangedCallback !== undefined)
      this.onStateChangedCallback({ state: name, context: this.context });

    if (this.currentState.isTerminal) {
      if (this.onTerminatedCallback !== undefined) {
        this.onTerminatedCallback({
          state: this.currentState.name,
          context: this.context,
        });
      }
    } else {
      await this.currentState.emitOnEnter();
    }
  }

  onStateChanged(callback: (params: { state: string; context: T }) => void) {
    this.onStateChangedCallback = callback;
  }

  private getState(stateName: string) {
    const state = this.states.find((state) => state.name === stateName);
    if (state === undefined) throw new Error(`Invalid state: ${stateName}`);

    return state;
  }

  onTerminated(callback: (params: { state: string; context: T }) => void) {
    this.onTerminatedCallback = callback;
  }

  get success() {
    if (this.currentState === undefined) return false;
    return this.final.includes(this.currentState?.name);
  }

  get terminated() {
    return this.currentState?.isTerminal === true;
  }

  clearListeners() {
    this.onStateChangedCallback = undefined;
    this.onTerminatedCallback = undefined;
  }
}

// Compose machines
// =============================================================================
// const compose2 = <A, B>(
//   machineA: Machine<A>,
//   machineB: Machine<B>,
// ): Machine<A & B> => {
//   // let currentState: string | undefined = undefined;
//   let currentContext: A & B = { ...machineA.context, ...machineB.context };
//   let onStateChangedCallback: MachineCallback<A & B> | undefined = undefined;
//   let onTerminatedCallback: MachineCallback<A & B> | undefined = undefined;

//   machineA.onStateChanged(({ state, context }) => {
//     // currentState = state;
//     currentContext = { ...currentContext, ...context };

//     if (!onStateChangedCallback) return;

//     onStateChangedCallback({
//       state,
//       context: currentContext,
//     });
//   });

//   machineA.onTerminated(async ({ state, context }) => {
//     currentContext = { ...currentContext, ...context };

//     // Transition to B
//     if (machineA.success) {
//       await machineB.start();
//       return;
//     }

//     // Otherwise the machine didn't reach the final state, so we stop
//     if (onTerminatedCallback !== undefined) {
//       onTerminatedCallback({
//         state,
//         context: currentContext,
//       });
//     }
//   });

//   machineB.onStateChanged(({ state, context }) => {
//     // currentState = state;
//     currentContext = { ...currentContext, ...context };

//     if (!onStateChangedCallback) return;

//     onStateChangedCallback({
//       state,
//       context: currentContext,
//     });
//   });

//   machineB.onTerminated(({ state, context }) => {
//     currentContext = { ...currentContext, ...context };

//     if (onTerminatedCallback === undefined) return;

//     onTerminatedCallback({
//       state,
//       context: currentContext,
//     });
//   });

//   return {
//     context: currentContext,
//     async start(context?: A & B) {
//       await machineA.start(context);
//     },
//     get success() {
//       return machineA.success && machineB.success;
//     },
//     onStateChanged(callback: MachineCallback<A & B>) {
//       onStateChangedCallback = callback;
//     },
//     onTerminated(callback: MachineCallback<A & B>) {
//       onTerminatedCallback = callback;
//     },
//   };
// };

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

type MachineContexts<Machines extends Machine<unknown>[]> = UnionToIntersection<
  Machines[number]["context"]
>;

export function compose<Machines extends Machine<unknown>[]>(
  ...machines: Machines
): Machine<MachineContexts<Machines>> {
  if (machines.length < 2)
    throw new Error("At least two machines are required.");

  let currentContext: MachineContexts<Machines> = machines.reduce(
    // @ts-expect-error - This is fine because we're merging the context
    (acc, machine) => ({ ...acc, ...machine.context }),
    {} as MachineContexts<Machines>,
  );
  let terminated = false;

  let onStateChangedCallback:
    | MachineCallback<MachineContexts<Machines>>
    | undefined;
  let onTerminatedCallback:
    | MachineCallback<MachineContexts<Machines>>
    | undefined;

  machines.forEach((machine, index) => {
    machine.onStateChanged(({ state, context }) => {
      // @ts-expect-error - This is fine because we're merging the context
      currentContext = { ...currentContext, ...context };
      if (onStateChangedCallback) {
        onStateChangedCallback({ state, context: currentContext });
      }
    });

    machine.onTerminated(async ({ state, context }) => {
      // @ts-expect-error - This is fine because we're merging the context
      currentContext = { ...currentContext, ...context };

      if (index < machines.length - 1 && machine.success) {
        await machines[index + 1].start();
        return;
      }

      terminated = true;
      if (onTerminatedCallback) {
        onTerminatedCallback({ state, context: currentContext });
      }
    });
  });

  return {
    context: currentContext,
    async start(context?: MachineContexts<Machines>) {
      terminated = false;
      if (machines.length > 0) {
        await machines[0].start(context);
      }
    },
    get success() {
      return machines.every((machine) => machine.success);
    },
    onStateChanged(callback: MachineCallback<MachineContexts<Machines>>) {
      onStateChangedCallback = callback;
    },
    onTerminated(callback: MachineCallback<MachineContexts<Machines>>) {
      onTerminatedCallback = callback;
    },
    clearListeners() {
      onStateChangedCallback = undefined;
      onTerminatedCallback = undefined;
    },
    get terminated() {
      return terminated;
    },
  };
}

// Builder
// =============================================================================
interface MachineDefinition<T, S extends string> {
  context: T;
  initial: S;
  final: S | S[];
  states: Record<S, onEnterCallback | undefined>;
}

export const createMachine = <Context, States extends string>(
  fn: (
    transition: (name: States, context?: Context) => Promise<void>,
  ) => MachineDefinition<Context, States>,
): Machine<Context> => {
  // Helper function to transition a state in the current machine
  const transition = async (name: States, context?: Context) => {
    await machine.transition(name, context);
  };

  // Create the machine
  const definition = fn(transition);
  const machine = new StateMachine<Context>({
    initial: definition.initial,
    final: Array.isArray(definition.final)
      ? definition.final
      : [definition.final],
    context: definition.context,
  });
  Object.entries(definition.states).forEach(([stateName, onEnterCallback]) => {
    const state = new State(
      stateName,
      onEnterCallback as onEnterCallback | undefined,
    );
    machine.addState(state);
  });

  return machine;
};
