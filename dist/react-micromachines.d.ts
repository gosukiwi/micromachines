import { Machine } from './state-machine';
export declare const useMachine: <T>(getMachine: () => Machine<T>) => {
    ready: boolean;
    start: () => void;
    success: boolean;
    terminated: boolean;
    state?: string;
    context?: T | undefined;
};
export declare const useAutoStartingMachine: <T>(getMachine: () => Machine<T>) => {
    state: string | undefined;
    context: T | undefined;
    success: boolean;
    terminated: boolean;
};
export * from './state-machine';
