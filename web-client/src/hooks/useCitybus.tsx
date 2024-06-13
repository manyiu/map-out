import { useQueries, useQuery } from "@tanstack/react-query";
import { dbName } from "../repositories/indexedDb";
import { CitybusRoute, DataWrapper, RouteStop, Stop } from "./types";

const useCitybus = () => {
  const { data: routeData } = useQuery({
    queryKey: ["/citybus/route/ctb"],
    queryFn: async (): Promise<DataWrapper<CitybusRoute>> => {
      const response = await fetch(
        "https://rt.data.gov.hk/v2/transport/citybus/route/ctb"
      );
      return response.json();
    },
    staleTime: Infinity,
  });

  if (routeData) {
    const request = indexedDB.open(dbName, 1);

    request.onsuccess = () => {
      const transaction = request.result.transaction("routes-v2", "readwrite");
      const objectStore = transaction.objectStore("routes-v2");

      routeData.data.forEach((route) => {
        objectStore.put(route);
      });
    };
  }

  const {
    data: routeStopData,
    isLoading,
    error,
  } = useQueries({
    queries:
      [
        ...(routeData?.data.map(({ co, route }) => {
          return {
            queryKey: ["/citybus/route-stop/", co, route],
            queryFn: async (): Promise<DataWrapper<RouteStop>> => {
              const response = await fetch(
                `https://rt.data.gov.hk/v2/transport/citybus/route-stop/${co}/${route}/inbound`
              );

              if (!response.ok) {
                throw new Error(
                  `Failed to fetch /v2/transport/citybus/route-stop/${co}/${route}/inbound`
                );
              }

              return response.json();
            },
            staleTime: Infinity,
          };
        }) || []),
        ...(routeData?.data.map(({ co, route }) => {
          return {
            queryKey: ["/citybus/route-stop/", co, route],
            queryFn: async (): Promise<DataWrapper<RouteStop>> => {
              const response = await fetch(
                `https://rt.data.gov.hk/v2/transport/citybus/route-stop/${co}/${route}/outbound`
              );

              if (!response.ok) {
                throw new Error(
                  `Failed to fetch /v2/transport/citybus/route-stop/${co}/${route}/outbound`
                );
              }

              return response.json();
            },
            staleTime: Infinity,
          };
        }) || []),
      ] || [],
    combine: (results) => {
      return {
        data: results.map((result) => result.data?.data),
        isLoading: results.some((result) => result.isLoading),
        pending: results.some((result) => result.isPending),
        error: results.find((result) => result.error),
      };
    },
  });

  const stopList: string[] = [];

  for (const routeStops of routeStopData) {
    if (!routeStops) {
      continue;
    }

    for (const routeStop of routeStops) {
      if (!routeStop) {
        continue;
      }

      if (!stopList.includes(routeStop.stop)) {
        stopList.push(routeStop.stop);
      }
    }
  }

  const { data: stopData } = useQueries({
    queries: stopList.map((stop) => {
      return {
        queryKey: ["/citybus/stop/", stop],
        queryFn: async (): Promise<DataWrapper<Stop>> => {
          const response = await fetch(
            `https://rt.data.gov.hk/v2/transport/citybus/stop/${stop}`
          );

          if (!response.ok) {
            throw new Error(
              `Failed to fetch /v2/transport/citybus/stop/${stop}`
            );
          }

          return response.json();
        },
        staleTime: Infinity,
      };
    }),
    combine: (results) => {
      return {
        data: results.map((result) => result.data?.data),
        isLoading: results.some((result) => result.isLoading),
        pending: results.some((result) => result.isPending),
        error: results.find((result) => result.error),
      };
    },
  });

  if (stopData) {
    const request = indexedDB.open(dbName, 1);

    request.onsuccess = () => {
      const transaction = request.result.transaction("stops", "readwrite");
      const objectStore = transaction.objectStore("stops");

      stopData.forEach((stop) => {
        try {
          objectStore.put(stop);
        } catch (error) {
          console.error("Failed to put stop into indexedDB", error);
          console.log("stop", stop);
        }
      });
    };
  }

  return { data: stopData, isLoading, error: error?.error };
};

export default useCitybus;
