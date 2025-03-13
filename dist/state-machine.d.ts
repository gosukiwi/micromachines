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
export interface Machine<T> {
    context: T;
    start(context?: T): Promise<void>;
    onStateChanged(callback: MachineCallback<T>): void;
    onTerminated(callback: MachineCallback<T>): void;
    clearListeners(): void;
    success: boolean;
    terminated: boolean;
}
export declare class StateMachine<T> implements Machine<T> {
    context: T;
    states: State<T>[];
    initial: string;
    final: string[];
    currentState?: State<T>;
    onStateChangedCallback?: (params: {
        state: string;
        context: T;
    }) => void;
    onTerminatedCallback?: (params: {
        state: string;
        context: T;
    }) => void;
    history: string[];
    constructor({ initial, final, context, }: {
        initial: string;
        final: string[];
        context: T;
    });
    addState(state: State<T>): void;
    start(context?: Partial<T>): Promise<void>;
    transition(name: string, context?: Partial<T>): Promise<void>;
    onStateChanged(callback: (params: {
        state: string;
        context: T;
    }) => void): void;
    private getState;
    onTerminated(callback: (params: {
        state: string;
        context: T;
    }) => void): void;
    get success(): boolean;
    get terminated(): boolean;
    clearListeners(): void;
}
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type MachineContexts<Machines extends Machine<unknown>[]> = UnionToIntersection<Machines[number]["context"]>;
export declare function compose<Machines extends Machine<unknown>[]>(...machines: Machines): Machine<MachineContexts<Machines>>;
interface MachineDefinition<T, S extends string> {
    context: T;
    initial: S;
    final: S | S[];
    states: Record<S, onEnterCallback<T> | undefined>;
}
export declare const createMachine: <Context, States extends string>(fn: (transition: (name: States, context?: Partial<Context>) => Promise<void>) => MachineDefinition<Context, States>) => Machine<Context>;
export {};
