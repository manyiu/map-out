import { useState } from "react";
import { RouteCitybus, StopCitybus } from "../database/types";
import { sqliteWorker } from "../workers";

const useNearByCitybus = () => {
  const [stop, setStop] = useState<StopCitybus[]>([]);
  const [route, setRoute] = useState<RouteCitybus[]>([]);

  sqliteWorker.addEventListener("message", (event) => {
    if (event.data.type === "result::nearby-stop-citybus") {
      setStop(event.data.data);
    }

    if (event.data.type === "result::nearby-route-citybus") {
      setRoute(event.data.data);
    }
  });

  return { stop, route };
};

export default useNearByCitybus;
