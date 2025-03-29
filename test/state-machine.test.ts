import { setTimeout } from "timers/promises";
import { expect, test } from "vitest";
import {
  StateMachine,
  State,
  createMachine,
  runMachine,
} from "../src/lib/state-machine";

interface Person {
  name: string;
  age: number;
}

const fetchPeople = async (): Promise<Person[]> => {
  await setTimeout(10);
  return [{ name: "Thomas", age: 22 }];
};

test("navigation between states", async () => {
  expect.assertions(7);

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
    new State("INITIAL", async () => {
      await machine.transition("PEOPLE_LOADING");
    }),
  );

  machine.addState(
    new State("PEOPLE_LOADING", async () => {
      const people = await fetchPeople();
      await machine.transition("PEOPLE_LOADED", { people });
    }),
  );

  machine.addState(
    new State("PEOPLE_LOADED", async () => {
      expect(machine.context.people.length).toEqual(1);
      expect(machine.context.people[0].name).toEqual("Thomas");
      expect(machine.context.people[0].age).toEqual(22);
      await machine.transition("FINAL");
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
  await machine.start();

  while (!machine.terminated) {
    await setTimeout(10);
  }
});

test("builder", async () => {
  expect.assertions(3);

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
      async INITIAL() {
        await transition("PEOPLE_LOADING");
      },
      async PEOPLE_LOADING() {
        const people = await fetchPeople();
        await transition("PEOPLE_LOADED", { people });
      },
      PEOPLE_LOADED: undefined,
    },
  }));

  machine.onTerminated(() => {
    expect(machine.context.people.length).toEqual(1);
    expect(machine.context.people[0].name).toEqual("Thomas");
    expect(machine.context.people[0].age).toEqual(22);
  });

  // Set initial state and dispatch initial event
  await machine.start();

  while (!machine.terminated) {
    await setTimeout(10);
  }
});

test("can pass partial context in transitions");

test("can access context between transitions", async () => {
  interface Context {
    count: number;
  }

  type States = "INITIAL" | "FINAL";

  const machine = createMachine<Context, States>((transition) => ({
    context: { count: 10 },
    initial: "INITIAL",
    final: "FINAL",
    states: {
      async INITIAL(context) {
        await transition("FINAL", { count: context.count + 1 });
      },
      FINAL: undefined,
    },
  }));

  await machine.start();

  while (!machine.terminated) {
    await setTimeout(10);
  }

  expect(machine.context.count).toEqual(11);
});

test("can compose machines, happy case", async () => {
  interface ContextA {
    count: number;
  }

  type StatesA = "INITIAL" | "FINAL";

  const machineA = createMachine<ContextA, StatesA>((transition) => ({
    context: { count: 10 },
    initial: "INITIAL",
    final: "FINAL",
    states: {
      async INITIAL(context) {
        await transition("FINAL", { count: context.count + 1 });
      },
      FINAL: undefined,
    },
  }));

  interface ContextB {
    name: string;
    age: number;
  }

  type StatesB = "INITIAL" | "FINAL";

  const machineB = createMachine<ContextB, StatesB>((transition) => ({
    context: { name: "", age: 0 },
    initial: "INITIAL",
    final: "FINAL",
    states: {
      async INITIAL() {
        await runMachine({
          machine: machineA,
          success: async ({ count }) => {
            await transition("FINAL", { age: count });
          },
          failure: async () => {
            await transition("FINAL", { age: 0 });
          },
        });
      },
      FINAL: undefined,
    },
  }));

  await machineB.start();

  while (!machineB.terminated) {
    await setTimeout(10);
  }

  expect(machineB.currentState?.name).toEqual("FINAL");
  expect(machineB.context.age).toEqual(11);
});

test("can compose machines, unhappy case", async () => {
  interface ContextA {
    count: number;
  }

  type StatesA = "INITIAL" | "FINAL" | "ERROR";

  const machineA = createMachine<ContextA, StatesA>((transition) => ({
    context: { count: 10 },
    initial: "INITIAL",
    final: "FINAL",
    states: {
      async INITIAL() {
        await transition("ERROR");
      },
      FINAL: undefined,
      ERROR: undefined,
    },
  }));

  interface ContextB {
    name: string;
    age: number;
  }

  type StatesB = "INITIAL" | "FINAL" | "ERROR";

  const machineB = createMachine<ContextB, StatesB>((transition) => ({
    context: { name: "", age: 0 },
    initial: "INITIAL",
    final: "FINAL",
    states: {
      async INITIAL() {
        await runMachine({
          machine: machineA,
          success: async ({ count }) => {
            await transition("FINAL", { age: count });
          },
          failure: async () => {
            await transition("ERROR", { age: 0 });
          },
        });
      },
      FINAL: undefined,
      ERROR: undefined,
    },
  }));

  await machineB.start();

  while (!machineB.terminated) {
    await setTimeout(10);
  }

  expect(machineB.currentState?.name).toEqual("ERROR");
  expect(machineB.context.age).toEqual(0);
});
