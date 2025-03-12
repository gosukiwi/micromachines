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

interface Machine<T> {
  context: T;
  start(context?: T): Promise<void>;
  // transition(state: string, context?: T): Promise<void>;
  onStateChanged(callback: MachineCallback<T>): void;
  onTerminated(callback: MachineCallback<T>): void;
  success: boolean;
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
}

export const compose = <A, B>(
  machineA: Machine<A>,
  machineB: Machine<B>,
  aFinal: string, // TODO: So we don't have to pass in the final state, each machine could have an array of "success" states we can check
): Machine<A & B> => {
  // let currentState: string | undefined = undefined;
  let currentContext: A & B = { ...machineA.context, ...machineB.context };
  let onStateChangedCallback: MachineCallback<A & B> | undefined = undefined;
  let onTerminatedCallback: MachineCallback<A & B> | undefined = undefined;

  machineA.onStateChanged(({ state, context }) => {
    // currentState = state;
    currentContext = { ...currentContext, ...context };

    if (!onStateChangedCallback) return;

    onStateChangedCallback({
      state,
      context: currentContext,
    });
  });

  machineA.onTerminated(async ({ state, context }) => {
    currentContext = { ...currentContext, ...context };

    // Transition to B
    if (state === aFinal) {
      await machineB.start();
      return;
    }

    // Otherwise the machine didn't reach the final state, so we stop
    if (onTerminatedCallback !== undefined) {
      onTerminatedCallback({
        state,
        context: currentContext,
      });
    }
  });

  machineB.onStateChanged(({ state, context }) => {
    // currentState = state;
    currentContext = { ...currentContext, ...context };

    if (!onStateChangedCallback) return;

    onStateChangedCallback({
      state,
      context: currentContext,
    });
  });

  machineB.onTerminated(({ state, context }) => {
    if (onTerminatedCallback !== undefined) {
      currentContext = { ...currentContext, ...context };
      onTerminatedCallback({
        state,
        context: currentContext,
      });
    }
  });

  return {
    context: currentContext,
    async start(context?: A & B) {
      await machineA.start(context);
    },
    get success() {
      return machineA.success && machineB.success;
    },
    onStateChanged(callback: MachineCallback<A & B>) {
      onStateChangedCallback = callback;
    },
    onTerminated(callback: MachineCallback<A & B>) {
      onTerminatedCallback = callback;
    },
  };
};

// Builder
interface MachineDefinition<T, S> {
  context: T;
  initial: S;
  final: S | S[];
  states: State[];
}

type StateBuilder<States> = (name: States, callback?: onEnterCallback) => State;

export const createMachine = <Context, States extends string>(
  fn: (
    stateBuilder: StateBuilder<States>,
    transition: (name: States, context?: Context) => Promise<void>,
  ) => MachineDefinition<Context, States>,
) => {
  // Helper state builder, tied to these generic types
  const createState: StateBuilder<States> = (
    name: States,
    callback?: onEnterCallback,
  ) => new State(name, callback);

  // Helper function to transition a state in the current machine
  const transition = async (name: States, context?: Context) => {
    await machine.transition(name, context);
  };

  // Create the machine
  const definition = fn(createState, transition);
  const machine = new StateMachine<Context>({
    initial: definition.initial,
    final: Array.isArray(definition.final)
      ? definition.final
      : [definition.final],
    context: definition.context,
  });
  definition.states.forEach((state) => {
    machine.addState(state);
  });

  return machine;
};
