import { useQueries } from "@tanstack/react-query";
import { DataWrapper, KmbStopEta } from "../api/types";
import { usePreferenceStore } from "../stores/preference";

const useKmbStopEta = (stopIds: string[] | null) => {
  const refetchInterval = usePreferenceStore((state) => state.refetchInterval);

  return useQueries({
    queries:
      stopIds?.map((stopId) => ({
        queryKey: ["kmb", "stop-eta", stopId],
        queryFn: async () => {
          if (!stopId) {
            return [];
          }

          const response = await fetch(
            `https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stopId}`
          );

          if (!response.ok) {
            throw new Error(
              `Failed to fetch /v1/transport/kmb/stop-eta/${stopId}`
            );
          }

          const responseJson = (await response.json()) as DataWrapper<
            KmbStopEta[]
          >;

          const test = responseJson.data.map((eta) => ({
            ...eta,
            stop: stopId,
          }));

          return test;
        },
        refetchInterval,
      })) || [],
    combine: (results) => {
      const combined = results.reduce<(KmbStopEta & { stop: string })[]>(
        (acc, result) => {
          if (result instanceof Error || !result.data) {
            return acc;
          }

          return [...acc, ...result.data];
        },
        []
      );

      const sorted = combined
        .filter((eta) => !!eta.eta)
        .sort((a, b) => {
          return new Date(a.eta!).getTime() - new Date(b.eta!).getTime();
        });

      return {
        data: sorted,
        isLoading: results.some((result) => result.isLoading),
        isFetching: results.some((result) => result.isFetching),
        isError: results.some((result) => result.isError),
      };
    },
  });
};

export default useKmbStopEta;
