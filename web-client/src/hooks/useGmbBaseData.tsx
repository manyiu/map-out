import { useQueries, useQuery } from "@tanstack/react-query";
import pLimit from "p-limit";
import {
  DataWrapper,
  RouteGmb,
  RouteListGmb,
  RouteStopListGmb,
  StopGmb,
} from "../api/types";
import worker from "../workers";

const limit = pLimit(10);
const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

const useGmbBaseData = () => {
  const { data: routeListData } = useQuery({
    queryKey: ["gmb", "route-list"],
    queryFn: async (): Promise<DataWrapper<RouteListGmb>> => {
      const response = await fetch("https://data.etagmb.gov.hk/route");

      if (!response.ok) {
        throw new Error("Failed to fetch /route");
      }

      const responseJson = (await response.json()) as DataWrapper<RouteListGmb>;

      return responseJson;
    },
    staleTime: ONE_WEEK,
  });

  const routeList: { region: "HKI" | "KLN" | "NT"; routeCode: string }[] = [];

  Object.keys(routeListData?.data.routes ?? {}).forEach((region) => {
    for (const routeCode of routeListData?.data.routes[
      region as "HKI" | "KLN" | "NT"
    ] ?? []) {
      routeList.push({ region: region as "HKI" | "KLN" | "NT", routeCode });
    }
  });

  const { data: routeData } = useQueries({
    queries:
      routeList?.map(({ region, routeCode }) => {
        return {
          queryKey: ["gmb", "route", region, routeCode],
          queryFn: async (): Promise<DataWrapper<RouteGmb[]>> => {
            const response = await limit(() =>
              fetch(`https://data.etagmb.gov.hk/route/${region}/${routeCode}`)
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch /route/${region}/${routeCode}`);
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

  const routeSeqList: { routeId: number; routeSeq: number }[] = [];

  for (const routes of routeData ?? []) {
    for (const route of routes ?? []) {
      for (const direction of route.directions ?? []) {
        routeSeqList.push({
          routeId: route.route_id,
          routeSeq: direction.route_seq,
        });
      }
    }
  }

  const { data: routeStopData } = useQueries({
    queries: routeSeqList.map(({ routeId, routeSeq }) => {
      return {
        queryKey: ["gmb", "route-stop", routeId, routeSeq],
        queryFn: async (): Promise<DataWrapper<RouteStopListGmb>> => {
          const response = await limit(() =>
            fetch(
              `https://data.etagmb.gov.hk/route-stop/${routeId}/${routeSeq}`
            )
          );

          if (!response.ok) {
            throw new Error(
              `Failed to fetch /route-stop/${routeId}/${routeSeq}`
            );
          }

          const responseJson =
            (await response.json()) as DataWrapper<RouteStopListGmb>;

          worker.postMessage({
            type: "save::route-stop-gmb",
            params: { routeId, routeSeq },
            data: responseJson.data,
          });

          return responseJson;
        },
        staleTime: ONE_WEEK,
      };
    }),
    combine(result) {
      return {
        data: result.map((result) => result.data?.data),
      };
    },
  });

  const stopIdList: number[] = [];

  for (const routeStops of routeStopData ?? []) {
    for (const routeStop of routeStops?.route_stops ?? []) {
      stopIdList.push(routeStop.stop_id);
    }
  }

  useQueries({
    queries:
      stopIdList.map((stopId) => {
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
