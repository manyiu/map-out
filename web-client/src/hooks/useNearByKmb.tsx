import { useEffect, useState } from "react";
import { RouteKmb, StopKmb } from "../repositories/types";
import { useMapStore } from "../stores/map";
import { usePreferenceStore } from "../stores/preference";
import { dbWorker } from "../workers";

const useNearByKmb = () => {
  const bounds = useMapStore((state) => state.bounds);
  const zoom = useMapStore((state) => state.zoom);
  const minDisplayZoom = usePreferenceStore((state) => state.minDisplayZoom);
  const [stop, setStop] = useState<StopKmb[]>([]);
  const [route, setRoute] = useState<RouteKmb[]>([]);

  useEffect(() => {
    const eventListener = (event: MessageEvent) => {
      if (
        event.data.type ===
        "result::database::get::kmb::get-stop-by-coordinates"
      ) {
        setStop(event.data.data);
      }

      if (
        event.data.type ===
        "result::database::get::kmb::get-route-by-coordinates"
      ) {
        setRoute(event.data.data);
      }
    };

    dbWorker.addEventListener("message", eventListener);

    if (bounds) {
      dbWorker.postMessage({
        type: "database::get::kmb::get-stop-by-coordinates",
        data: bounds,
      });

      dbWorker.postMessage({
        type: "database::get::kmb::get-route-by-coordinates",
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

export default useNearByKmb;
