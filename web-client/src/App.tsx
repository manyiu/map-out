import { Container } from "@chakra-ui/react";
import Map from "./components/map";
import { Source } from "./components/map/types";
import useDatabase from "./hooks/useDatabase";

function App() {
  useDatabase();

  return (
    <Container width="100%" maxWidth="100dvw" height="100dvh" padding={0}>
      <Map source={Source.OpenStreetMap} zoom={18} />
    </Container>
  );
}

export default App;
