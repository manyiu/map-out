import { useQueries } from "@tanstack/react-query";
import { DataWrapper, GmbEtaStop } from "../api/types";
import { usePreferenceStore } from "../stores/preference";

const useGmbStopEta = (stopIds: number[] | null) => {
  const refetchInterval = usePreferenceStore((state) => state.refetchInterval);

  const { data, isLoading, isFetching, isError } = useQueries({
    queries:
      stopIds?.map((stopId) => ({
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

          const responseJson = (await response.json()) as DataWrapper<
            GmbEtaStop[]
          >;

          return responseJson.data.map((eta) => ({ ...eta, stop: stopId }));
        },
        refetchInterval,
      })) || [],
    combine: (results) => {
      const combined = results.reduce<(GmbEtaStop & { stop: number })[]>(
        (acc, result) => {
          if (result instanceof Error || !result.data) {
            return acc;
          }

          return [...acc, ...result.data];
        },
        []
      );

      const flattenData = [];

      for (const routeEta of combined || []) {
        for (const eta of routeEta.eta) {
          flattenData.push({
            route_id: routeEta.route_id,
            route_seq: routeEta.route_seq,
            stop_seq: eta.eta_seq,
            enabled: routeEta.enabled,
            eta_seq: eta.eta_seq,
            diff: eta.diff,
            timestamp: eta.timestamp,
            remarks_tc: eta.remarks_tc,
            remarks_sc: eta.remarks_sc,
            remarks_en: eta.remarks_en,
          });
        }
      }

      return {
        data: flattenData,
        isLoading: results.some((result) => result.isLoading),
        isFetching: results.some((result) => result.isFetching),
        isError: results.some((result) => result.isError),
      };
    },
  });

  return { data, isLoading, isFetching, isError };
};

export default useGmbStopEta;
