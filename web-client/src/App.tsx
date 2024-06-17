import { Container } from "@chakra-ui/react";
import Map from "./Component/Map";
import { Source } from "./Component/Map/types";
import useCitybusBaseData from "./hooks/useCitybusBaseData";
import useGeolocation from "./hooks/useGeolocation";
import useKmbBaseData from "./hooks/useKmbBaseData";

function App() {
  const { position } = useGeolocation();
  useKmbBaseData();
  useCitybusBaseData();

  return (
    <Container width="100%" maxWidth="100dvw" padding={0}>
      <Map source={Source.OpenStreetMap} zoom={18} position={position} />
    </Container>
  );
}

export default App;
