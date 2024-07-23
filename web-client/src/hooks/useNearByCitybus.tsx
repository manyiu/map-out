import { useEffect, useState } from "react";
import { RouteCitybus, StopCitybus } from "../repositories/types";
import { useMapStore } from "../stores/map";
import { usePreferenceStore } from "../stores/preference";
import { dbWorker } from "../workers";

const useNearByCitybus = () => {
  const bounds = useMapStore((state) => state.bounds);
  const zoom = useMapStore((state) => state.zoom);
  const minDisplayZoom = usePreferenceStore((state) => state.minDisplayZoom);
  const [stop, setStop] = useState<StopCitybus[]>([]);
  const [route, setRoute] = useState<RouteCitybus[]>([]);

  useEffect(() => {
    const eventListener = (event: MessageEvent) => {
      if (
        event.data.type ===
        "result::database::get::citybus::get-stop-by-coordinates"
      ) {
        setStop(event.data.data);
      }

      if (
        event.data.type ===
        "result::database::get::citybus::get-route-by-coordinates"
      ) {
        setRoute(event.data.data);
      }
    };

    dbWorker.addEventListener("message", eventListener);

    if (bounds) {
      dbWorker.postMessage({
        type: "database::get::citybus::get-stop-by-coordinates",
        data: bounds,
      });

      dbWorker.postMessage({
        type: "database::get::citybus::get-route-by-coordinates",
        data: bounds,
      });
    }

    return () => {
      dbWorker.removeEventListener("message", eventListener);
    };
  }, [bounds]);

  return {
    stop: minDisplayZoom <= zoom ? stop : [],
    route: minDisplayZoom <= zoom ? route : [],
  };
};

export default useNearByCitybus;
