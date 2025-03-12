# Micro Machines

Minimalistic state machines for TypeScript and React.

```typescript
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

Machines are designed to run a process and track its progress.
