import { ChakraProvider } from "@chakra-ui/react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./repositories/indexedDb.ts";
import { persister, queryClient } from "./repositories/queryClient";
import theme from "./theme.ts";
import "./workers";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <App />
      </PersistQueryClientProvider>
    </ChakraProvider>
  </React.StrictMode>
);
