import { useQuery } from "@tanstack/react-query";
import worker from "../workers";
import { DataWrapper, RouteKmb, RouteStopKmb, StopKmb } from "./types";

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

const useKmbBaseData = () => {
  const { isLoading: routeIsLoading, error: routeError } = useQuery({
    queryKey: ["/kmb/route"],
    queryFn: async (): Promise<DataWrapper<RouteKmb[]>> => {
      const response = await fetch(
        "https://data.etabus.gov.hk/v1/transport/kmb/route"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch /v1/transport/kmb/route");
      }

      const responseJson = (await response.json()) as DataWrapper<RouteKmb[]>;

      worker.postMessage({
        type: "save::route-kmb",
        data: responseJson.data,
      });

      return responseJson;
    },
    staleTime: ONE_WEEK,
  });

  const { isLoading: routeStopIsLoading, error: routeStopError } = useQuery({
    queryKey: ["/kmb/route-stop"],
    queryFn: async (): Promise<DataWrapper<RouteStopKmb[]>> => {
      const response = await fetch(
        "https://data.etabus.gov.hk/v1/transport/kmb/route-stop"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch /v1/transport/kmb/route-stop");
      }

      const responseJson = (await response.json()) as DataWrapper<
        RouteStopKmb[]
      >;

      worker.postMessage({
        type: "save::route-stop-kmb",
        data: responseJson.data,
      });

      return responseJson;
    },
    staleTime: ONE_WEEK,
  });

  const { isLoading: stopIsLoading, error: stopError } = useQuery({
    queryKey: ["/kmb/stop"],
    queryFn: async (): Promise<DataWrapper<StopKmb>> => {
      const response = await fetch(
        "https://data.etabus.gov.hk/v1/transport/kmb/stop"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch /v1/transport/kmb/stop");
      }

      const responseJson = (await response.json()) as DataWrapper<StopKmb>;

      worker.postMessage({
        type: "save::stop-kmb",
        data: responseJson.data,
      });

      return responseJson;
    },
    staleTime: ONE_WEEK,
  });

  return {
    isLoading: routeIsLoading || routeStopIsLoading || stopIsLoading,
    error: routeError || routeStopError || stopError,
  };
};

export default useKmbBaseData;
