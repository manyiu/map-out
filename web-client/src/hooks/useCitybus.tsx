import { useQueries, useQuery } from "@tanstack/react-query";
import worker from "../workers";
import { DataWrapper, RouteStopV2, RouteV2, Stop } from "./types";

const useCitybus = () => {
  const { data: routeData } = useQuery({
    queryKey: ["/citybus/route/ctb"],
    queryFn: async (): Promise<DataWrapper<RouteV2[]>> => {
      const response = await fetch(
        "https://rt.data.gov.hk/v2/transport/citybus/route/ctb"
      );

      const responseJson = await response.json();

      worker.postMessage({
        type: "route-v2",
        data: responseJson.data,
      });

      return responseJson;
    },
    staleTime: Infinity,
  });

  const { data: routeStopData } = useQueries({
    queries:
      [
        ...(routeData?.data.map(({ co, route }) => {
          return {
            queryKey: ["/citybus/route-stop/", co, route],
            queryFn: async (): Promise<DataWrapper<RouteStopV2[]>> => {
              const response = await fetch(
                `https://rt.data.gov.hk/v2/transport/citybus/route-stop/${co}/${route}/inbound`
              );

              if (!response.ok) {
                throw new Error(
                  `Failed to fetch /v2/transport/citybus/route-stop/${co}/${route}/inbound`
                );
              }

              const responseJson = (await response.json()) as DataWrapper<
                RouteStopV2[]
              >;

              worker.postMessage({
                type: "route-stop-v2",
                data: responseJson.data,
              });

              return responseJson;
            },
            staleTime: Infinity,
          };
        }) || []),
        ...(routeData?.data.map(({ co, route }) => {
          return {
            queryKey: ["/citybus/route-stop/", co, route],
            queryFn: async (): Promise<DataWrapper<RouteStopV2[]>> => {
              const response = await fetch(
                `https://rt.data.gov.hk/v2/transport/citybus/route-stop/${co}/${route}/outbound`
              );

              if (!response.ok) {
                throw new Error(
                  `Failed to fetch /v2/transport/citybus/route-stop/${co}/${route}/outbound`
                );
              }

              const responseJson = (await response.json()) as DataWrapper<
                RouteStopV2[]
              >;

              worker.postMessage({
                type: "route-stop-v2",
                data: responseJson.data,
              });

              return responseJson;
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

  useQueries({
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

          const responseJson = (await response.json()) as DataWrapper<Stop>;

          worker.postMessage({
            type: "stop",
            data: [responseJson.data],
          });

          return responseJson;
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
};

export default useCitybus;
