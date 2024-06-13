import { useQuery } from "@tanstack/react-query";
import { dbName } from "../repositories/indexedDb";
import { DataWrapper, KmbRoute, Stop } from "./types";

const useKmb = () => {
  const {
    data: routeData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/kmb/route"],
    queryFn: async (): Promise<DataWrapper<KmbRoute>> => {
      const response = await fetch(
        "https://data.etabus.gov.hk/v1/transport/kmb/route"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch /v1/transport/kmb/route");
      }

      return response.json();
    },
    staleTime: Infinity,
  });

  if (routeData) {
    const request = indexedDB.open(dbName, 1);

    request.onsuccess = () => {
      const transaction = request.result.transaction("routes-v1", "readwrite");
      const objectStore = transaction.objectStore("routes-v1");

      routeData.data.forEach((route) => {
        objectStore.put(route);
      });
    };
  }

  const { data: stopData } = useQuery({
    queryKey: ["/kmb/stop"],
    queryFn: async (): Promise<DataWrapper<Stop>> => {
      const response = await fetch(
        "https://data.etabus.gov.hk/v1/transport/kmb/stop"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch /v1/transport/kmb/stop");
      }

      return response.json();
    },
    staleTime: Infinity,
  });

  if (stopData) {
    const request = indexedDB.open(dbName, 1);

    request.onsuccess = () => {
      const transaction = request.result.transaction("stops", "readwrite");
      const objectStore = transaction.objectStore("stops");

      stopData.data.forEach((stop) => {
        objectStore.put(stop);
      });
    };
  }

  return { data: routeData?.data, isLoading, error };
};

export default useKmb;
