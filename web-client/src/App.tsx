import { Container } from "@chakra-ui/react";
import Map from "./Component/Map";
import { Source } from "./Component/Map/types";
import useCitybus from "./hooks/useCitybus";
import useGeolocation from "./hooks/useGeolocation";
import useKmb from "./hooks/useKmb";
import useNearBy from "./hooks/useNearBy";

function App() {
  const { position } = useGeolocation();
  const { isLoading, error } = useCitybus();
  useKmb();
  useNearBy();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  return (
    <Container width="100%" maxWidth="100dvw" padding={0}>
      <Map source={Source.OpenStreetMap} zoom={20} position={position} />
    </Container>
  );
}

export default App;
