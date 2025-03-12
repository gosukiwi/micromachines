import { useCallback, useEffect, useState } from "react";
import { type Machine } from "./state-machine";

interface MachineState<T> {
  state?: string;
  context?: T;
}

export const useMachine = <T>(getMachine: () => Machine<T>) => {
  const [machine, setMachine] = useState<Machine<T> | undefined>();
  const [machineState, setMachineState] = useState<MachineState<T>>({
    context: undefined,
    state: undefined,
  });

  useEffect(() => {
    const machine = getMachine();

    machine.onStateChanged(({ state, context }) => {
      setMachineState({ state, context: { ...context } });
    });

    setMachine(machine);

    return () => {
      machine.clearListeners();
      setMachine(undefined);
    };
  }, [getMachine]);

  const start = useCallback(() => {
    machine?.start().catch((err: unknown) => {
      throw err;
    });
  }, [machine]);

  return {
    ...machineState,
    ready: machine !== undefined,
    start,
    success: machine?.success === true,
    terminated: machine?.terminated === true,
  };
};

export const useAutoStartingMachine = <T>(getMachine: () => Machine<T>) => {
  const { start, state, context, ready, success, terminated } =
    useMachine(getMachine);

  useEffect(() => {
    if (ready) start();
  }, [ready, start]);

  return {
    state,
    context,
    success,
    terminated,
  };
};

export * from "./state-machine";
