import { useQuery } from "@tanstack/react-query";
import { DataWrapper, GmbEtaStop } from "../api/types";
import { usePreferenceStore } from "../stores/preference";

const useGmbStopEta = (stopId: number | null) => {
  const refetchInterval = usePreferenceStore((state) => state.refetchInterval);

  return useQuery({
    queryKey: ["gmb", "eta", "stop", stopId],
    queryFn: async () => {
      if (!stopId) {
        return [];
      }

      const response = await fetch(
        `https://data.etagmb.gov.hk/eta/stop/${stopId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch gmb /eta/stop/${stopId}`);
      }

      const responseJson = (await response.json()) as DataWrapper<GmbEtaStop[]>;

      return responseJson.data;
    },
    refetchInterval,
  });
};

export default useGmbStopEta;
