import { Machine } from './state-machine';
export declare const useMachine: <T>(getMachine: () => Machine<T>) => {
    ready: boolean;
    start: (context?: Partial<T>) => void;
    success: boolean;
    terminated: boolean;
    state?: string;
    context?: T | undefined;
};
export declare const useAutoStartingMachine: <T>(getMachine: () => Machine<T>, startContext?: T) => {
    state: string | undefined;
    context: T | undefined;
    success: boolean;
    terminated: boolean;
};
export * from './state-machine';
