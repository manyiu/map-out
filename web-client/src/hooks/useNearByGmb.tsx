import { useState } from "react";
import { GmbRoute, GmbStop } from "../repositories/types";
import { dbWorker } from "../workers";

const useNearByGmb = () => {
  const [stop, setStop] = useState<GmbStop[]>([]);
  const [route, setRoute] = useState<GmbRoute[]>([]);

  dbWorker.addEventListener("message", (event) => {
    if (event.data.type === "result::nearby-stop-gmb") {
      setStop(event.data.data);
    }

    if (event.data.type === "result::nearby-route-gmb") {
      setRoute(event.data.data);
    }
  });

  return { stop, route };
};

export default useNearByGmb;
