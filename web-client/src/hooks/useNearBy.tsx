import { useState } from "react";
import worker from "../workers";
import { RouteV1, RouteV2, StopDb } from "./types";

const useNearBy = () => {
  const [stop, setStop] = useState<StopDb[]>([]);
  const [route, setRoute] = useState<(RouteV1 | RouteV2)[]>([]);

  worker.onmessage = (event) => {
    if (event.data.type === "result::stops") {
      console.log("stop");
      console.log(event.data.data);
      setStop(event.data.data);
    }

    if (event.data.type === "result::routes") {
      console.log("route");
      console.log(event.data.data);
      setRoute(event.data.data);
    }
  };

  return { stop, route };
};

export default useNearBy;
