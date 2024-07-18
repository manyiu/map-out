import { Container } from "@chakra-ui/react";
import Map from "./components/Map";
import Menu from "./components/Menu";
import useDatabase from "./hooks/useDatabase";

function App() {
  useDatabase();

  return (
    <>
      <Menu />
      <Container width="100%" maxWidth="100dvw" height="100dvh" padding={0}>
        <Map />
      </Container>
    </>
  );
}

export default App;
