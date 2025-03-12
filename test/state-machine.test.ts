import { expect, test } from "vitest";
import {
  StateMachine,
  State,
  compose,
  createMachine,
} from "../src/lib/state-machine";

interface Person {
  name: string;
  age: number;
}

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const fetchPeople = async (): Promise<Person[]> => {
  wait(10);
  return [{ name: "Thomas", age: 22 }];
};

test("navigation between states", () => {
  interface Context {
    people: Person[];
  }

  const machine = new StateMachine<Context>({
    initial: "INITIAL",
    final: ["FINAL"],
    context: { people: [] },
  });

  // Add states
  machine.addState(
    new State("INITIAL", () => {
      machine.transition("PEOPLE_LOADING");
    }),
  );

  machine.addState(
    new State("PEOPLE_LOADING", async () => {
      const people = await fetchPeople();
      machine.transition("PEOPLE_LOADED", { people });
    }),
  );

  machine.addState(
    new State("PEOPLE_LOADED", () => {
      expect(machine.context.people.length).toEqual(1);
      expect(machine.context.people[0].name).toEqual("Thomas");
      expect(machine.context.people[0].age).toEqual(22);
      machine.transition("FINAL");
    }),
  );

  machine.addState(new State("FINAL"));

  machine.onTerminated(() => {
    expect(machine.history[0]).toEqual("INITIAL");
    expect(machine.history[1]).toEqual("PEOPLE_LOADING");
    expect(machine.history[2]).toEqual("PEOPLE_LOADED");
    expect(machine.history[3]).toEqual("FINAL");
  });

  // Set initial state and dispatch initial event
  machine.start();
});

test("builder", async () => {
  expect.assertions(6);

  interface Context {
    people: Person[];
  }

  type States = "INITIAL" | "PEOPLE_LOADING" | "PEOPLE_LOADED";

  const machine = createMachine<Context, States>((transition) => ({
    context: {
      people: [],
    },
    initial: "INITIAL",
    final: "PEOPLE_LOADED",
    states: {
      INITIAL() {
        transition("PEOPLE_LOADING");
      },
      async PEOPLE_LOADING() {
        const people = await fetchPeople();
        transition("PEOPLE_LOADED", { people });
      },
      PEOPLE_LOADED: undefined,
    },
  }));

  machine.onTerminated(() => {
    expect(machine.history[0]).toEqual("INITIAL");
    expect(machine.history[1]).toEqual("PEOPLE_LOADING");
    expect(machine.history[2]).toEqual("PEOPLE_LOADED");
    expect(machine.context.people.length).toEqual(1);
    expect(machine.context.people[0].name).toEqual("Thomas");
    expect(machine.context.people[0].age).toEqual(22);
  });

  // Set initial state and dispatch initial event
  await machine.start();
});

test("compose machines", () => {
  expect.assertions(2);

  interface MachineAContext {
    name: string;
  }

  interface MachineBContext {
    age: number;
  }

  const machineA = new StateMachine<MachineAContext>({
    initial: "INITIAL",
    final: ["FINAL"],
    context: {
      name: "",
    },
  });
  machineA.addState(
    new State("INITIAL", () => {
      machineA.transition("FINAL", { name: "Fede" });
    }),
  );
  machineA.addState(new State("FINAL"));

  const machineB = new StateMachine<MachineBContext>({
    initial: "INITIAL",
    final: ["FINAL"],
    context: {
      age: 0,
    },
  });
  machineB.addState(
    new State("INITIAL", () => {
      machineB.transition("FINAL", { age: 35 });
    }),
  );
  machineB.addState(new State("FINAL"));

  // Compose machines A and B
  machineA.onTerminated(() => {
    machineB.transition("INITIAL");
  });

  machineB.onTerminated(() => {
    const mixedContext = { ...machineA.context, ...machineB.context };
    expect(mixedContext.name).toEqual("Fede");
    expect(mixedContext.age).toEqual(35);
  });

  machineA.start();
});

test("compose 2 machines using builder", async () => {
  expect.assertions(3);

  // Machine A
  // ===========================================================================
  interface MachineAContext {
    name: string;
  }

  type MachineAStates = "INITIAL" | "FINAL";

  const machineA = createMachine<MachineAContext, MachineAStates>(
    (transition) => ({
      context: { name: "" },
      initial: "INITIAL",
      final: "FINAL",
      states: {
        INITIAL() {
          transition("FINAL", { name: "Fede" });
        },
        FINAL: undefined,
      },
    }),
  );

  // Machine B
  // ===========================================================================
  interface MachineBContext {
    age: number;
  }

  type MachineBStates = "INITIAL" | "FINAL";

  const machineB = createMachine<MachineBContext, MachineBStates>(
    (transition) => ({
      initial: "INITIAL",
      final: "FINAL",
      context: { age: 0 },
      states: {
        INITIAL() {
          transition("FINAL", { age: 35 });
        },
        FINAL: undefined,
      },
    }),
  );

  // Create a composite machine (instance) from two machines (also instances)
  // ===========================================================================
  const composite = compose(machineA, machineB);

  composite.onTerminated(({ state, context }) => {
    expect(state).toEqual("FINAL");
    expect(context.name).toEqual("Fede");
    expect(context.age).toEqual(35);
  });

  composite.start();
});

test("compose 3 machines using builder", async () => {
  expect.assertions(4);

  // Machine A
  // ===========================================================================
  interface MachineAContext {
    name: string;
  }

  type MachineAStates = "INITIAL" | "FINAL";

  const machineA = createMachine<MachineAContext, MachineAStates>(
    (transition) => ({
      context: { name: "" },
      initial: "INITIAL",
      final: "FINAL",
      states: {
        INITIAL() {
          transition("FINAL", { name: "Fede" });
        },
        FINAL: undefined,
      },
    }),
  );

  // Machine B
  // ===========================================================================
  interface MachineBContext {
    age: number;
  }

  type MachineBStates = "INITIAL" | "FINAL";

  const machineB = createMachine<MachineBContext, MachineBStates>(
    (transition) => ({
      initial: "INITIAL",
      final: "FINAL",
      context: { age: 0 },
      states: {
        INITIAL() {
          transition("FINAL", { age: 35 });
        },
        FINAL: undefined,
      },
    }),
  );

  // Machine C
  // ===========================================================================
  interface MachineCContext {
    country: string;
  }

  type MachineCStates = "INITIAL" | "FINAL";

  const machineC = createMachine<MachineCContext, MachineCStates>(
    (transition) => ({
      initial: "INITIAL",
      final: "FINAL",
      context: { country: "" },
      states: {
        INITIAL() {
          transition("FINAL", { country: "Argentina" });
        },
        FINAL: undefined,
      },
    }),
  );

  // Create a composite machine (instance) from two machines (also instances)
  // ===========================================================================
  const composite = compose(machineA, machineB, machineC);

  composite.onTerminated(({ state, context }) => {
    expect(state).toEqual("FINAL");
    expect(context.name).toEqual("Fede");
    expect(context.age).toEqual(35);
    expect(context.country).toEqual("Argentina");
  });

  composite.start();
});
