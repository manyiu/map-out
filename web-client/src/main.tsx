import { ChakraProvider } from "@chakra-ui/react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./repositories/indexedDb.ts";
import { persister, queryClient } from "./repositories/queryClient";
import theme from "./theme.ts";

const worker = new Worker(new URL("./workers/sqlite.js", import.meta.url), {
  type: "module",
});
worker.onmessage = (e) => {
  console.log("Message received from worker", e.data);
};

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
