import { useQuery } from "@tanstack/react-query";
import { RvmResponse } from "../api/types";
import { useLocationFilterStore } from "../stores/locationFilter";
import { useMapStore } from "../stores/map";

const useRvm = () => {
  const rvmFilter = useLocationFilterStore((state) => state.rvm);
  const bounds = useMapStore((state) => state.bounds) as {
    _northEast: { lat: number; lng: number };
    _southWest: { lat: number; lng: number };
  } | null;

  const { data, isError, isLoading, isFetching } = useQuery({
    queryKey: ["rvm", rvmFilter],
    queryFn: async () => {
      if (!rvmFilter) {
        return [];
      }

      const response = await fetch("https://albarvm.teamnote.work/api/rvm/");

      if (!response.ok) {
        throw new Error("Failed to fetch rvm data");
      }

      const responseJson = (await response.json()) as RvmResponse;

      return responseJson.rvms;
    },
    refetchInterval: 1000 * 60 * 15,
  });

  if (!bounds || !data) {
    return { data: [] };
  }

  const filteredData = data.filter((rvm) => {
    return (
      rvm.coordinates[0] < bounds._northEast.lat &&
      rvm.coordinates[0] > bounds._southWest.lat &&
      rvm.coordinates[1] < bounds._northEast.lng &&
      rvm.coordinates[1] > bounds._southWest.lng
    );
  });

  return { data: filteredData, isError, isLoading, isFetching };
};

export default useRvm;
