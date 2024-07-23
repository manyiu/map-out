import { Container } from "@chakra-ui/react";
import ErrorBoundary from "./components/ErrorBoundary";
import EtaList from "./components/EtaList";
import Filter from "./components/Filter";
import Map from "./components/Map";
import Menu from "./components/Menu";
import useDatabase from "./hooks/useDatabase";

function App() {
  useDatabase();

  return (
    <>
      <EtaList />
      <Filter />
      <Menu />
      <Container width="100%" maxWidth="100dvw" height="100dvh" padding={0}>
        <ErrorBoundary>
          <Map />
        </ErrorBoundary>
      </Container>
    </>
  );
}

export default App;
