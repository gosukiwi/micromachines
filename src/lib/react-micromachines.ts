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
      setMachineState({ state, context });
    });

    setMachine(machine);

    return () => {
      machine.clearListeners();
      setMachine(undefined);
    };
  }, [getMachine]);

  const start = useCallback(() => {
    machine?.start();
  }, [machine]);

  return {
    ...machineState,
    ready: machine !== undefined,
    start,
  };
};

export const useAutoStartingMachine = <T>(getMachine: () => Machine<T>) => {
  const { start, state, context, ready } = useMachine(getMachine);

  useEffect(() => {
    if (ready) start();
  }, [ready, start]);

  return {
    state,
    context,
  };
};

export * from "./state-machine";
