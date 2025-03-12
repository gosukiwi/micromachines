import { useEffect, useState } from "react";
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

  return {
    ...machineState,
    start() {
      machine?.start();
    },
  };
};

export * from "./state-machine";
