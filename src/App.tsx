import "./App.css";
import { useMachine, createMachine } from "./lib/react-micromachines";

interface Person {
  name: string;
  age: number;
}

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const fetchPeople = async (): Promise<Person[]> => {
  await wait(1000);
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
        transition("FINAL", { people });
      },
      FINAL: undefined,
    },
  }));

function App() {
  const { start, state, context } = useMachine(peopleMachine);

  return (
    <div>
      <p>State: {state}</p>
      {context?.people.map((person) => (
        <div>
          <p>Name: {person.name}</p>
          <p>Age: {person.age}</p>
        </div>
      ))}

      <button onClick={start}>Start</button>
    </div>
  );
}

export default App;
