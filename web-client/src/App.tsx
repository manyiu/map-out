import { Container } from "@chakra-ui/react";
import Map from "./components/map";
import { Source } from "./components/map/types";

function App() {
  return (
    <Container width="100%" maxWidth="100dvw" padding={0}>
      <Map source={Source.OpenStreetMap} zoom={18} />
    </Container>
  );
}

export default App;
