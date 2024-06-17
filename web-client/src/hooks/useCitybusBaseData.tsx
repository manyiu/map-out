import { useQueries, useQuery } from "@tanstack/react-query";
import pLimit from "p-limit";
import worker from "../workers";
import {
  DataWrapper,
  RouteCitybus,
  RouteStopCitybus,
  StopCitybus,
} from "./types";

const limit = pLimit(10);
const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

const useCitybusBaseData = () => {
  const {
    data: routeData,
    isLoading: routeIsLoading,
    error: routeError,
  } = useQuery({
    queryKey: ["/citybus/route/ctb"],
    queryFn: async (): Promise<DataWrapper<RouteCitybus[]>> => {
      const response = await fetch(
        "https://rt.data.gov.hk/v2/transport/citybus/route/ctb"
      );

      const responseJson = await response.json();

      worker.postMessage({
        type: "save::route-citybus",
        data: responseJson.data,
      });

      return responseJson;
    },
    staleTime: ONE_WEEK,
  });

  const {
    data: routeStopData,
    isLoading: routeStopIsLoading,
    error: routeStopError,
  } = useQueries({
    queries:
      [
        ...(routeData?.data.map(({ co, route }) => {
          return {
            queryKey: ["/citybus/route-stop/", co, route],
            queryFn: async (): Promise<DataWrapper<RouteStopCitybus[]>> => {
              const response = await limit(() =>
                fetch(
                  `https://rt.data.gov.hk/v2/transport/citybus/route-stop/${co}/${route}/inbound`
                )
              );

              if (!response.ok) {
                throw new Error(
                  `Failed to fetch /v2/transport/citybus/route-stop/${co}/${route}/inbound`
                );
              }

              const responseJson = (await response.json()) as DataWrapper<
                RouteStopCitybus[]
              >;

              worker.postMessage({
                type: "save::route-stop-citybus",
                data: responseJson.data,
              });

              return responseJson;
            },
            staleTime: ONE_WEEK,
          };
        }) || []),
        ...(routeData?.data.map(({ co, route }) => {
          return {
            queryKey: ["/citybus/route-stop/", co, route],
            queryFn: async (): Promise<DataWrapper<RouteStopCitybus[]>> => {
              const response = await limit(() =>
                fetch(
                  `https://rt.data.gov.hk/v2/transport/citybus/route-stop/${co}/${route}/outbound`
                )
              );

              if (!response.ok) {
                throw new Error(
                  `Failed to fetch /v2/transport/citybus/route-stop/${co}/${route}/outbound`
                );
              }

              const responseJson = (await response.json()) as DataWrapper<
                RouteStopCitybus[]
              >;

              worker.postMessage({
                type: "save::route-stop-citybus",
                data: responseJson.data,
              });

              return responseJson;
            },
            staleTime: ONE_WEEK,
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

  const { isLoading: stopIsLoading, error: stopError } = useQueries({
    queries: stopList.map((stop) => {
      return {
        queryKey: ["/citybus/stop/", stop],
        queryFn: async (): Promise<DataWrapper<StopCitybus>> => {
          const response = await limit(() =>
            fetch(`https://rt.data.gov.hk/v2/transport/citybus/stop/${stop}`)
          );

          if (!response.ok) {
            throw new Error(
              `Failed to fetch /v2/transport/citybus/stop/${stop}`
            );
          }

          const responseJson =
            (await response.json()) as DataWrapper<StopCitybus>;

          worker.postMessage({
            type: "save::stop-citybus",
            data: responseJson.data,
          });

          return responseJson;
        },
        staleTime: ONE_WEEK,
      };
    }),
    combine: (results) => {
      return {
        isLoading: results.some((result) => result.isLoading),
        error: results.find((result) => result.error),
      };
    },
  });

  return {
    isLoading: routeIsLoading || routeStopIsLoading || stopIsLoading,
    error: routeError || routeStopError || stopError,
  };
};

export default useCitybusBaseData;
