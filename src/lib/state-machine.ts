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

export interface Machine<T> {
  context: T;
  start(context?: Partial<T>): Promise<void>;
  // transition(state: string, context?: T): Promise<void>;
  onStateChanged(callback: MachineCallback<T>): void;
  onTerminated(callback: MachineCallback<T>): void;
  clearListeners(): void;
  success: boolean;
  terminated: boolean;
}

export class StateMachine<T> implements Machine<T> {
  context: T;
  states: State<T>[];
  initial: string;
  final: string[];
  currentState?: State<T>;
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

    this.history.push(name);

    if (context !== undefined) {
      this.context = { ...this.context, ...context };
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
      await this.currentState.emitOnEnter(this.context);
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
    return this.final.includes(this.currentState.name);
  }

  get terminated() {
    return this.currentState?.isTerminal === true;
  }

  clearListeners() {
    this.onStateChangedCallback = undefined;
    this.onTerminatedCallback = undefined;
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
): Machine<Context> => {
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
