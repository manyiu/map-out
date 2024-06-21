import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useBoundsStore } from "../stores/bounds";
import {
  CsdiDataQueryWrapper,
  DataWrapper,
  EtaGmb,
  EtaRouteStopGmb,
  RouteGmb,
  StopRouteGmb,
  TerminusLocationCoordinateGmb,
} from "./types";

interface DataGroupedByStopRoute {
  routeId: number;
  routeCode: string;
  eta: EtaGmb[];
}

interface DataGroupedByStop {
  stopId: number;
  lat: number;
  long: number;
  routes: DataGroupedByStopRoute[];
}

const useNearByGmb = () => {
  const bounds = useBoundsStore((state) => state.bounds);
  const [dataGroupedByStop, setDataGroupedByStop] = useState<
    DataGroupedByStop[]
  >([]);

  const { data: nearbyStopData } = useQuery({
    queryKey: ["gmb-nearby-stop", bounds],
    queryFn: async () => {
      const response = await fetch(
        `https://api.csdi.gov.hk/apim/dataquery/api/?id=td_rcd_1638874728005_80512&layer=stop_gmb&bbox-crs=WGS84&bbox=${
          bounds.getWest
        },${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}&limit=10&offset=0`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch /stop_gmb");
      }

      const responseJson =
        (await response.json()) as CsdiDataQueryWrapper<TerminusLocationCoordinateGmb>;

      return responseJson;
    },
    enabled: !!bounds,
    staleTime: 1000 * 60 * 24 * 7,
  });

  const stopRoutes = useQueries({
    queries:
      nearbyStopData?.features.map(({ properties: { STOP_ID: stopId } }) => ({
        queryKey: ["gmb-stop-route", stopId],
        queryFn: async () => {
          const response = await fetch(
            `https://data.etagmb.gov.hk/stop-route/${stopId}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch /stop-route");
          }

          const responseJson = (await response.json()) as DataWrapper<
            StopRouteGmb[]
          >;

          const result = {
            ...responseJson,
            stopId,
          };

          return result;
        },
        staleTime: 1000 * 60 * 24 * 7,
      })) || [],
  });

  const stopEtcData = useQueries({
    queries:
      nearbyStopData?.features.map(({ properties: { STOP_ID: stopId } }) => ({
        queryKey: ["gmb-eta", stopId],
        queryFn: async () => {
          const response = await fetch(
            `https://data.etagmb.gov.hk/eta/stop/${stopId}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch /eta/stop");
          }

          const responseJson = (await response.json()) as DataWrapper<
            EtaRouteStopGmb[]
          >;

          const result = {
            ...responseJson,
            stopId,
          };

          return result;
        },
        staleTime: 0,
      })) || [],
  });

  const routeList: number[] = [];

  stopRoutes.map(({ data }) => {
    data?.data.map(({ route_id: routeId }) => {
      routeList.push(routeId);
    });
  });

  const routesData = useQueries({
    queries: routeList.map((routeId) => ({
      queryKey: ["gmb-route", routeId],
      queryFn: async () => {
        const response = await fetch(
          `https://data.etagmb.gov.hk/route/${routeId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch /route");
        }

        const responseJson = (await response.json()) as DataWrapper<RouteGmb[]>;

        return responseJson;
      },
      staleTime: 1000 * 60 * 24 * 7,
    })),
  });

  useEffect(() => {
    if (!nearbyStopData || !stopEtcData || !stopRoutes || !routesData) {
      return;
    }

    const dataGroupedByStop: DataGroupedByStop[] = [];

    for (const stop of nearbyStopData.features) {
      const stopId = stop.properties.STOP_ID;

      const routes: DataGroupedByStopRoute[] = [];

      for (const stopEta of stopEtcData) {
        if (stopEta.data?.stopId === stopId) {
          for (const stopEtaRoute of stopEta.data.data) {
            let routeCode: string = "";

            findRouteCodeLoop: for (const routes of routesData) {
              for (const route of routes.data?.data ?? []) {
                if (stopEtaRoute.route_id === route.route_id) {
                  routeCode = route.route_code;
                  break findRouteCodeLoop;
                }
              }
            }

            if (!routeCode) {
              continue;
            }

            routes.push({
              routeId: stopEtaRoute.route_id,
              routeCode,
              eta: stopEtaRoute.eta,
            });
          }
        }
      }

      dataGroupedByStop.push({
        stopId,
        lat: stop.geometry.coordinates[1],
        long: stop.geometry.coordinates[0],
        routes,
      });
    }

    console.log("setDataGroupedByStop");
    setDataGroupedByStop(dataGroupedByStop);
  }, [nearbyStopData, routesData, stopEtcData, stopRoutes]);

  return { dataGroupedByStop };
};

export default useNearByGmb;
