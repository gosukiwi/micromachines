# Micromachines

Minimalistic state machines for TypeScript and React.

# Installation

    $ npm i gosukiwi/micromachines

# Quickstart

```typescript
import { createMachine } from "micro-machines/react";

type States = "INITIAL" | "FINAL";

interface Context {
  people: Person[];
}

const peopleMachine = () =>
  createMachine<Context, States>((transition) => ({
    context: {
      people: [],
    },
    initial: "INITIAL",
    final: "FINAL",
    states: {
      async INITIAL() {
        const people = await fetchPeople();
        await transition("FINAL", { people });
      },
      FINAL: undefined,
    },
  }));
```

A [machine](https://developer.mozilla.org/en-US/docs/Glossary/State_machine)
is a set of states, transitions between those states, and some data called
context.

In the above example we create a machine that fetches people though a
fictional People API.

State machines make it very easy to run a process and track its progress:

```typescript
import { useMachine } from 'micro-machines/react'

const StartWithActionDemo = () => {
  const { start, state, context } = useMachine(peopleMachine);

  return (
    <div>
      <h3>This state machine executes after the button is pressed</h3>
      <p>State: {state}</p>

      {context?.people.map((person) => (
        <div key={person.id}>
          <p>Name: {person.name}</p>
          <p>Age: {person.age}</p>
        </div>
      ))}

      <button onClick={start}>Start</button>
    </div>
  );
};
```

Machines can also start automatically, convenient for some React use-cases:

```typescript
const AutoStartDemo = () => {
  const { state, context } = useAutoStartingMachine(peopleMachine);

  return (
    <div>
      <h3>This state machine runs as soon a it's rendered</h3>
      <p>State: {state}</p>
      {context?.people.map((person) => (
        <div key={person.id}>
          <p>Name: {person.name}</p>
          <p>Age: {person.age}</p>
        </div>
      ))}
    </div>
  );
};
```

To handle errors, simply go to an error state:

```typescript
const peopleMachine = () =>
  createMachine<Context, States>((transition) => ({
    context: {
      people: [],
      error?: Error,
    },
    initial: "INITIAL",
    final: "FINAL",
    states: {
      async INITIAL() {
        // IMPORTANT: Note that a non-terminal state (a state that's not undefined)
        // must always transition to another state, otherwise the machine will be
        // stuck in that state, and will not terminate.
        const people = await fetchPeople();
        try {
          await transition("FINAL", { people });
        } catch (error) {
          await transition("ERROR", { error: new Error("Something went wrong!") })
        }
      },
      FINAL: undefined,
      ERROR: undefined,
    },
  }));
```

If the machine is not in a state defined in `final`, then `machine.success`
will be `false`. You can access `success` directly in the React hook. You also
get a `terminated` boolean to know whether the machine terminated or not.

```typescript
const { start, state, context, success, terminated } =
  useMachine(peopleMachine);
```

## Composing Machines

Machines can call other machines using `runMachine`:

```typescript
const myMachine = createMachine<MyContext, MyStates>((transition) => ({
  context: { value: 0 },
  initial: "INITIAL",
  final: "FINAL",
  states: {
    async INITIAL() {
      // We use `runMachine` to execute a machine, and transition accordingly
      await runMachine({
        machine: incrementCounterMachine,
        context: { count: 10 }, // Optional initial context
        async success({ count }) {
          await transition("FINAL", { value: count });
        },
        async failure() {
          await transition("ERROR");
        },
      });
    },
    FINAL: undefined,
    ERROR: undefined,
  },
}));
```
