type onEnterCallback<T> = (context: T) => void | Promise<void>;
export declare class State<T> {
    name: string;
    onEnter?: onEnterCallback<T>;
    constructor(name: string, onEnter?: onEnterCallback<T>);
    emitOnEnter(context: T): Promise<void>;
    get isTerminal(): boolean;
}
type MachineCallback<T> = (params: {
    state: string;
    context: T;
}) => void;
export declare class StateMachine<T> {
    context: T;
    states: State<T>[];
    initial: string;
    final: string[];
    currentState?: State<T>;
    onStateChangedCallback: MachineCallback<T>[];
    onTerminatedCallback: MachineCallback<T>[];
    history: string[];
    constructor({ initial, final, context, }: {
        initial: string;
        final: string[];
        context: T;
    });
    addState(state: State<T>): void;
    start(context?: Partial<T>): Promise<void>;
    transition(name: string, context?: Partial<T>): Promise<void>;
    onStateChanged(callback: MachineCallback<T>): void;
    private getState;
    onTerminated(callback: MachineCallback<T>): void;
    get success(): boolean;
    get terminated(): boolean;
    clearListeners(): void;
}
interface MachineDefinition<T, S extends string> {
    context: T;
    initial: S;
    final: S | S[];
    states: Record<S, onEnterCallback<T> | undefined>;
}
export declare const createMachine: <Context, States extends string>(fn: (transition: (name: States, context?: Partial<Context>) => Promise<void>) => MachineDefinition<Context, States>) => StateMachine<Context>;
type CallMachineCallback<T> = (context: T) => Promise<void>;
export declare const runMachine: <T>({ machine, context, success, failure, }: {
    machine: StateMachine<T>;
    context?: Partial<T>;
    success: CallMachineCallback<T>;
    failure: CallMachineCallback<T>;
}) => Promise<void>;
export {};
