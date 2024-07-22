import { Container } from "@chakra-ui/react";
import EtaList from "./components/EtaList";
import Map from "./components/Map";
import Menu from "./components/Menu";
import Rvm from "./components/Rvm";
import useDatabase from "./hooks/useDatabase";

function App() {
  useDatabase();

  return (
    <>
      <EtaList />
      <Rvm />
      <Menu />
      <Container width="100%" maxWidth="100dvw" height="100dvh" padding={0}>
        <Map />
      </Container>
    </>
  );
}

export default App;
