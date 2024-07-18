import { useQueries } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CitybusStopRouteEta, DataWrapper } from "../api/types";
import { RouteCitybus } from "../repositories/types";
import { usePreferenceStore } from "../stores/preference";
import { dbWorker } from "../workers";

const useCitybusStopEta = (stopId: string | null) => {
  const refetchInterval = usePreferenceStore((state) => state.refetchInterval);
  const [routes, setRoutes] = useState<RouteCitybus[]>([]);
  const { data, isLoading, isFetching, isError } = useQueries({
    queries: routes.map((route) => ({
      queryKey: ["citybus", "eta", stopId, route.route],
      queryFn: async () => {
        if (!stopId || !route.route) {
          return [];
        }

        const response = await fetch(
          `https://rt.data.gov.hk/v2/transport/citybus/eta/CTB/${stopId}/${route.route}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch /v2/transport/citybus/eta/CTB/${stopId}/${route.route}`
          );
        }

        const responseJson = (await response.json()) as DataWrapper<
          CitybusStopRouteEta[]
        >;

        return responseJson.data;
      },
      refetchInterval,
    })),
    combine: (results) => {
      const combined = results.reduce<CitybusStopRouteEta[]>((acc, result) => {
        if (result instanceof Error || !result.data) {
          return acc;
        }

        return [...acc, ...result.data];
      }, []);

      const sorted = combined.sort((a, b) => {
        return new Date(a.eta).getTime() - new Date(b.eta).getTime();
      });

      return {
        data: sorted,
        isLoading: results.some((result) => result.isLoading),
        isFetching: results.some((result) => result.isFetching),
        isError: results.some((result) => result.isError),
      };
    },
  });

  useEffect(() => {
    const eventListener = (event: MessageEvent) => {
      if (
        event.data.type === "result::database::get::citybus::get-route-by-stop"
      ) {
        setRoutes(event.data.data);
      }
    };

    dbWorker.addEventListener("message", eventListener);

    dbWorker.postMessage({
      type: "database::get::citybus::get-route-by-stop",
      data: stopId,
    });

    return () => {
      dbWorker.removeEventListener("message", eventListener);
    };
  }, [stopId]);

  return { data, isLoading, isFetching, isError };
};

export default useCitybusStopEta;
