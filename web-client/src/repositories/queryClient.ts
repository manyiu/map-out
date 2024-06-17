import { QueryClient } from "@tanstack/react-query";
import {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

const idbValidKey: IDBValidKey = "reactQuery";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: true,
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

const persister: Persister = {
  persistClient: async (client: PersistedClient) => {
    await set(idbValidKey, client);
  },
  restoreClient: async () => {
    return await get<PersistedClient>(idbValidKey);
  },
  removeClient: async () => {
    await del(idbValidKey);
  },
};

export { persister, queryClient };
