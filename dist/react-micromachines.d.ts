import { StateMachine } from './state-machine';
export declare const useMachine: <T>(getMachine: () => StateMachine<T>) => {
    ready: boolean;
    start: (context?: Partial<T>) => void;
    success: boolean;
    terminated: boolean;
    state?: string;
    context?: T | undefined;
};
export declare const useAutoStartingMachine: <T>(getMachine: () => StateMachine<T>, startContext?: T) => {
    state: string | undefined;
    context: T | undefined;
    success: boolean;
    terminated: boolean;
};
export * from './state-machine';
