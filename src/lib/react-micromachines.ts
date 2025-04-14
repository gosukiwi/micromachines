import { useCallback, useEffect, useState } from "react";
import { type StateMachine } from "./state-machine";

interface MachineState<T> {
  state?: string;
  context?: T;
}

export const useMachine = <T>(getMachine: () => StateMachine<T>) => {
  const [machine, setMachine] = useState<StateMachine<T> | undefined>();
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

  const start = useCallback(
    (context?: Partial<T>) => {
      machine?.start(context).catch((err: unknown) => {
        throw err;
      });
    },
    [machine],
  );

  return {
    ...machineState,
    ready: machine !== undefined,
    start,
    success: machine?.success === true,
    terminated: machine?.terminated === true,
  };
};

export const useAutoStartingMachine = <T>(
  getMachine: () => StateMachine<T>,
  startContext?: Partial<T>,
) => {
  const { start, state, context, ready, success, terminated } =
    useMachine(getMachine);

  useEffect(() => {
    if (ready) start(startContext);
  }, [ready, start, startContext]);

  return {
    state,
    context,
    success,
    terminated,
  };
};

export * from "./state-machine";
