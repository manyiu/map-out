import { useQueries, useQuery } from "@tanstack/react-query";
import { useBoundsStore } from "../stores/bounds";
import {
  CsdiDataQueryWrapper,
  DataGroupedByStop,
  DataGroupedByStopRoute,
  DataWrapper,
  EtaRouteStopGmb,
  RouteDirectionGmb,
  RouteGmb,
  StopRouteGmb,
  TerminusLocationCoordinateGmb,
} from "./types";

const useNearByGmb = () => {
  const bounds = useBoundsStore((state) => state.bounds);

  const { data: nearbyStopData } = useQuery({
    queryKey: ["gmb-nearby-stop", bounds],
    queryFn: async () => {
      const response = await fetch(
        `https://api.csdi.gov.hk/apim/dataquery/api/?id=td_rcd_1638874728005_80512&layer=stop_gmb&bbox-crs=WGS84&bbox=${bounds?.getWest()},${bounds?.getSouth()},${bounds?.getEast()},${bounds?.getNorth()}&limit=10&offset=0`
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

  if (
    !bounds ||
    !nearbyStopData ||
    !stopEtcData ||
    !stopRoutes ||
    !routesData
  ) {
    return { dataGroupedByStop: [] };
  }

  const dataGroupedByStop: DataGroupedByStop[] = [];

  for (const stop of nearbyStopData.features) {
    const stopId = stop.properties.STOP_ID;

    const routes: DataGroupedByStopRoute[] = [];

    for (const stopEta of stopEtcData) {
      if (stopEta.data?.stopId === stopId) {
        for (const stopEtaRoute of stopEta.data.data) {
          let targetRoute: RouteGmb | null = null;

          findRouteCodeLoop: for (const routes of routesData) {
            for (const route of routes.data?.data ?? []) {
              if (stopEtaRoute.route_id === route.route_id) {
                targetRoute = route;
                break findRouteCodeLoop;
              }
            }
          }

          if (!targetRoute || !targetRoute.route_code) {
            continue;
          }

          let targetStopRoute: StopRouteGmb | null = null;

          findStopRouteLoop: for (const stopRoute of stopRoutes) {
            for (const route of stopRoute.data?.data ?? []) {
              if (
                stopEtaRoute.route_id === route.route_id &&
                stopEtaRoute.route_seq === route.route_seq
              ) {
                targetStopRoute = route;
                break findStopRouteLoop;
              }
            }
          }

          if (!targetStopRoute) {
            continue;
          }

          let targetDirection: RouteDirectionGmb | null = null;

          for (const direction of targetRoute.directions) {
            if (direction.route_seq === stopEtaRoute.route_seq) {
              targetDirection = direction;
              break;
            }
          }

          if (!targetDirection) {
            continue;
          }

          routes.push({
            routeId: stopEtaRoute.route_id,
            routeCode: targetRoute.route_code,
            routeSeq: targetStopRoute.route_seq,
            stopSeq: targetStopRoute.stop_seq,
            stopName: {
              tc: targetStopRoute.name_tc,
              sc: targetStopRoute.name_sc,
              en: targetStopRoute.name_en,
            },
            description: {
              tc: targetRoute.description_tc,
              sc: targetRoute.description_sc,
              en: targetRoute.description_en,
            },
            direction: {
              orig: {
                tc: targetDirection.orig_tc,
                sc: targetDirection.orig_sc,
                en: targetDirection.orig_en,
              },
              dest: {
                tc: targetDirection.dest_tc,
                sc: targetDirection.dest_sc,
                en: targetDirection.dest_en,
              },
              remarks: {
                tc: targetDirection.remarks_tc,
                sc: targetDirection.remarks_sc,
                en: targetDirection.remarks_en,
              },
            },
            eta: stopEtaRoute.eta.map((eta) => ({
              etaSeq: eta.eta_seq,
              diff: eta.diff,
              timestamp: eta.timestamp,
              remarks: {
                tc: eta.remarks_tc,
                sc: eta.remarks_sc,
                en: eta.remarks_en,
              },
            })),
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

  return { dataGroupedByStop };
};

export default useNearByGmb;
