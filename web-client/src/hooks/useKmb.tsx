import { useQuery } from "@tanstack/react-query";
import worker from "../workers";
import { DataWrapper, RouteStopV1, RouteV1, Stop } from "./types";

const useKmb = () => {
  useQuery({
    queryKey: ["/kmb/route"],
    queryFn: async (): Promise<DataWrapper<RouteV1[]>> => {
      const response = await fetch(
        "https://data.etabus.gov.hk/v1/transport/kmb/route"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch /v1/transport/kmb/route");
      }

      const responseJson = (await response.json()) as DataWrapper<RouteV1[]>;

      worker.postMessage({
        type: "route-v1",
        data: responseJson.data,
      });

      return responseJson;
    },
    // staleTime: Infinity,
  });

  useQuery({
    queryKey: ["/kmb/route-stop"],
    queryFn: async (): Promise<DataWrapper<RouteStopV1[]>> => {
      const response = await fetch(
        "https://data.etabus.gov.hk/v1/transport/kmb/route-stop"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch /v1/transport/kmb/route-stop");
      }

      const responseJson = (await response.json()) as DataWrapper<
        RouteStopV1[]
      >;

      worker.postMessage({
        type: "route-stop-v1",
        data: responseJson.data,
      });

      return responseJson;
    },
    // staleTime: Infinity,
  });

  useQuery({
    queryKey: ["/kmb/stop"],
    queryFn: async (): Promise<DataWrapper<Stop[]>> => {
      const response = await fetch(
        "https://data.etabus.gov.hk/v1/transport/kmb/stop"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch /v1/transport/kmb/stop");
      }

      const responseJson = (await response.json()) as DataWrapper<Stop[]>;

      worker.postMessage({
        type: "stop",
        data: responseJson.data,
      });

      return responseJson;
    },
    // staleTime: Infinity,
  });
};

export default useKmb;
