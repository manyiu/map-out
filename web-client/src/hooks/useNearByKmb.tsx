import { useState } from "react";
import { RouteKmb, StopKmb } from "../repositories/types";
import { dbWorker } from "../workers";

const useNearByKmb = () => {
  const [stop, setStop] = useState<StopKmb[]>([]);
  const [route, setRoute] = useState<RouteKmb[]>([]);

  dbWorker.addEventListener("message", (event) => {
    if (event.data.type === "result::nearby-stop-kmb") {
      setStop(event.data.data);
    }

    if (event.data.type === "result::nearby-route-kmb") {
      setRoute(event.data.data);
    }
  });

  return { stop, route };
};

export default useNearByKmb;
