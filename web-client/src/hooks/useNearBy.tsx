import { useEffect, useState } from "react";
import worker from "../workers";
import { RouteV1, RouteV2, Stop } from "./types";

const useNearBy = (position: GeolocationPosition | null) => {
  const [stop, setStop] = useState<Stop[]>([]);
  const [route, setRoute] = useState<(RouteV1 | RouteV2)[]>([]);

  worker.onmessage = (event) => {
    if (event.data.type === "nearby") {
      console.log(event.data.data);
    }
  };

  useEffect(() => {
    console.log("useNearBy", position);
    worker.postMessage({ type: "nearby", data: position });
  }, [position]);

  return { stop, route };
};

export default useNearBy;
