import { Container } from "@chakra-ui/react";
import Map from "./Component/Map";
import { Source } from "./Component/Map/types";
import useCitybus from "./hooks/useCitybus";
import useGeolocation from "./hooks/useGeolocation";
import useKmb from "./hooks/useKmb";

function App() {
  const { position } = useGeolocation();
  useCitybus();
  useKmb();

  return (
    <Container width="100%" maxWidth="100dvw" padding={0}>
      <Map source={Source.OpenStreetMap} zoom={20} position={position} />
    </Container>
  );
}

export default App;
