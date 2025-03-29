type onEnterCallback<T> = (context: T) => void | Promise<void>;

export class State<T> {
  name: string;
  onEnter?: onEnterCallback<T>;

  constructor(name: string, onEnter?: onEnterCallback<T>) {
    this.name = name;
    this.onEnter = onEnter;
  }

  async emitOnEnter(context: T) {
    if (this.onEnter === undefined) return;
    await this.onEnter(context);
  }

  get isTerminal() {
    return this.onEnter === undefined;
  }
}

type MachineCallback<T> = (params: { state: string; context: T }) => void;

export class StateMachine<T> {
  context: T;
  states: State<T>[];
  initial: string;
  final: string[];
  currentState?: State<T>;
  onStateChangedCallback: MachineCallback<T>[];
  onTerminatedCallback: MachineCallback<T>[];

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
    this.onStateChangedCallback = [];
    this.onTerminatedCallback = [];
  }

  addState(state: State<T>) {
    this.states.push(state);
  }

  async start(context?: Partial<T>) {
    await this.transition(this.initial, context);
  }

  async transition(name: string, context?: Partial<T>) {
    const state = this.getState(name);
    if (state.name === this.currentState?.name)
      throw new Error(`Already in ${name}`);

    if (context !== undefined) {
      this.context = { ...this.context, ...context };
    }

    this.currentState = state;
    this.onStateChangedCallback.forEach((callback) => {
      callback({ state: name, context: this.context });
    });

    if (this.currentState.isTerminal) {
      this.onTerminatedCallback.forEach((callback) => {
        callback({
          state: name,
          context: this.context,
        });
      });
    } else {
      await this.currentState.emitOnEnter(this.context);
    }
  }

  onStateChanged(callback: MachineCallback<T>) {
    this.onStateChangedCallback.push(callback);
  }

  private getState(stateName: string) {
    const state = this.states.find((state) => state.name === stateName);
    if (state === undefined) throw new Error(`Invalid state: ${stateName}`);

    return state;
  }

  onTerminated(callback: MachineCallback<T>) {
    this.onTerminatedCallback.push(callback);
  }

  get success() {
    if (this.currentState === undefined) return false;
    return this.final.includes(this.currentState.name);
  }

  get terminated() {
    return this.currentState?.isTerminal === true;
  }

  clearListeners() {
    this.onStateChangedCallback = [];
    this.onTerminatedCallback = [];
  }
}

// Builder
// =============================================================================
interface MachineDefinition<T, S extends string> {
  context: T;
  initial: S;
  final: S | S[];
  states: Record<S, onEnterCallback<T> | undefined>;
}

export const createMachine = <Context, States extends string>(
  fn: (
    transition: (name: States, context?: Partial<Context>) => Promise<void>,
  ) => MachineDefinition<Context, States>,
): StateMachine<Context> => {
  // Helper function to transition a state in the current machine
  const transition = async (name: States, context?: Partial<Context>) => {
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
      onEnterCallback as onEnterCallback<Context> | undefined,
    );
    machine.addState(state);
  });

  return machine;
};

// Compose
// =============================================================================
type CallMachineCallback<T> = (context: T) => Promise<void>;

export const runMachine = async <T>({
  machine,
  context,
  success,
  failure,
}: {
  machine: StateMachine<T>;
  context?: Partial<T>;
  success: CallMachineCallback<T>;
  failure: CallMachineCallback<T>;
}) => {
  machine.onTerminated(({ context }) => {
    if (machine.success) {
      success(context).catch((err: unknown) => {
        throw err;
      });
    } else {
      failure(context).catch((err: unknown) => {
        throw err;
      });
    }
  });

  await machine.start(context);
};
