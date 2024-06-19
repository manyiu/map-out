import { useQueries, useQuery } from "@tanstack/react-query";
import pLimit from "p-limit";
import worker from "../workers";
import {
  DataWrapper,
  LastUpdateRouteGmb,
  LastUpdateStopGmb,
  RouteGmb,
  RouteStopGmb,
  StopGmb,
} from "./types";

const limit = pLimit(10);
const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

const useGmbBaseData = () => {
  const { data: routeLateUpdateData } = useQuery({
    queryKey: ["gmb", "last-update", "route"],
    queryFn: async (): Promise<DataWrapper<LastUpdateRouteGmb[]>> => {
      const response = await fetch(
        "https://data.etagmb.gov.hk/last-update/route"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch /last-update/route");
      }

      const responseJson = (await response.json()) as DataWrapper<
        LastUpdateRouteGmb[]
      >;

      return responseJson;
    },
    staleTime: ONE_WEEK,
  });

  const { data: routeData } = useQueries({
    queries:
      routeLateUpdateData?.data?.map(({ route_id: routeId }) => {
        return {
          queryKey: ["gmb", "route", routeId],
          queryFn: async (): Promise<DataWrapper<RouteGmb[]>> => {
            const response = await limit(() =>
              fetch(`https://data.etagmb.gov.hk/route/${routeId}`)
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch /route/${routeId}`);
            }

            const responseJson = (await response.json()) as DataWrapper<
              RouteGmb[]
            >;

            worker.postMessage({
              type: "save::route-gmb",
              data: responseJson.data,
            });

            return responseJson;
          },
          staleTime: ONE_WEEK,
        };
      }) ?? [],
    combine(results) {
      return {
        data: results.map((result) => result.data?.data),
      };
    },
  });

  const routeList: number[] = [];

  for (const routes of routeData) {
    if (!routes) {
      continue;
    }

    for (const route of routes) {
      routeList.push(route.route_id);
    }
  }

  useQueries({
    queries: routeList.map((routeId) => {
      return {
        queryKey: ["gmb", "route-stop", routeId],
        queryFn: async (): Promise<DataWrapper<RouteStopGmb[]>> => {
          const response = await limit(() =>
            fetch(`https://data.etagmb.gov.hk/route-stop/${routeId}`)
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch /route-stop/${routeId}`);
          }

          const responseJson = (await response.json()) as DataWrapper<
            RouteStopGmb[]
          >;

          worker.postMessage({
            type: "save::route-stop-gmb",
            data: responseJson.data,
          });

          return responseJson;
        },
        staleTime: ONE_WEEK,
      };
    }),
  });

  const { data: lastUpdateStopData } = useQuery({
    queryKey: ["gmb", "last-update", "stop"],
    queryFn: async (): Promise<DataWrapper<LastUpdateStopGmb[]>> => {
      const response = await fetch(
        "https://data.etagmb.gov.hk/last-update/stop"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch /last-update/stop");
      }

      const responseJson = (await response.json()) as DataWrapper<
        LastUpdateStopGmb[]
      >;

      return responseJson;
    },
    staleTime: ONE_WEEK,
  });

  useQueries({
    queries:
      lastUpdateStopData?.data?.map(({ stop_id: stopId }) => {
        return {
          queryKey: ["gmb", "stop", stopId],
          queryFn: async (): Promise<DataWrapper<StopGmb>> => {
            const response = await limit(() =>
              fetch(`https://data.etagmb.gov.hk/stop/${stopId}`)
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch /stop/${stopId}`);
            }

            const responseJson =
              (await response.json()) as DataWrapper<StopGmb>;

            worker.postMessage({
              type: "save::stop-gmb",
              data: { ...responseJson.data, id: stopId },
            });

            return responseJson;
          },
          staleTime: ONE_WEEK,
        };
      }) ?? [],
  });

  return null;
};

export default useGmbBaseData;
