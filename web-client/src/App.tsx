import { Container } from "@chakra-ui/react";
import Map from "./components/map";
import { Source } from "./components/map/types";
import useCitybusBaseData from "./hooks/useCitybusBaseData";
import useGmbBaseData from "./hooks/useGmbBaseData";
import useKmbBaseData from "./hooks/useKmbBaseData";

function App() {
  useKmbBaseData();
  useCitybusBaseData();
  useGmbBaseData();

  return (
    <Container width="100%" maxWidth="100dvw" padding={0}>
      <Map source={Source.OpenStreetMap} zoom={18} />
    </Container>
  );
}

export default App;
