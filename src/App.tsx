import "./App.css";
import {
  useMachine,
  useAutoStartingMachine,
  createMachine,
} from "./lib/react-micromachines";

interface Person {
  name: string;
  age: number;
}

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const fetchPeople = async (): Promise<Person[]> => {
  await wait(500);
  return [{ name: "Thomas", age: 22 }];
};

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

const StartWithActionDemo = () => {
  const { start, state, context, success, terminated } =
    useMachine(peopleMachine);

  const startMachine = () => {
    start({ people: [] });
  };

  return (
    <div>
      <h3>This state machine executes after the button is pressed</h3>
      <p>State: {state}</p>
      <p>Success: {success ? "true" : "false"}</p>
      <p>Terminated: {terminated ? "true" : "false"}</p>

      {context?.people.map((person) => (
        <div key={person.name}>
          <p>Name: {person.name}</p>
          <p>Age: {person.age}</p>
        </div>
      ))}

      <button onClick={startMachine}>Start</button>
    </div>
  );
};

const AutoStartDemo = () => {
  const { state, context } = useAutoStartingMachine(peopleMachine);

  return (
    <div>
      <h3>This state machine runs as soon a it's rendered</h3>
      <p>State: {state}</p>
      {context?.people.map((person) => (
        <div key={person.name}>
          <p>Name: {person.name}</p>
          <p>Age: {person.age}</p>
        </div>
      ))}
    </div>
  );
};

function App() {
  return (
    <>
      <AutoStartDemo />
      <StartWithActionDemo />
    </>
  );
}

export default App;
