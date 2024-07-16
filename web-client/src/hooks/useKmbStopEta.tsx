import { useQuery } from "@tanstack/react-query";
import { DataWrapper, KmbStopEta } from "../api/types";

const useKmbStopEta = (stopId: string | null) => {
  return useQuery({
    queryKey: ["kmb", "stop-eta", stopId],
    queryFn: async () => {
      if (!stopId) {
        return [];
      }

      const response = await fetch(
        `https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stopId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch /v1/transport/kmb/stop-eta/${stopId}`);
      }

      const responseJson = (await response.json()) as DataWrapper<KmbStopEta[]>;

      return responseJson.data;
    },
  });
};

export default useKmbStopEta;
