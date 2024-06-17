import { useState } from "react";
import { RouteKmb, StopKmb } from "../repositories/types";
import worker from "../workers";

const useNearByKmb = () => {
  const [stop, setStop] = useState<StopKmb[]>([]);
  const [route, setRoute] = useState<RouteKmb[]>([]);

  worker.addEventListener("message", (event) => {
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
