import { useQuery } from "@tanstack/react-query";
import { DataWrapper, KmbStopEta } from "../api/types";
import { usePreferenceStore } from "../stores/preference";

const useKmbStopEta = (stopId: string | null) => {
  const refetchInterval = usePreferenceStore((state) => state.refetchInterval);

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
    refetchInterval,
  });
};

export default useKmbStopEta;
