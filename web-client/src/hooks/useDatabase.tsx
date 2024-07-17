import { useEffect, useState } from "react";
import { dbWorker, fetchWorker } from "../workers";

const useDatabase = () => {
  const [up, setUp] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      dbWorker.postMessage({
        type: "ping",
      });
    }, 1000);

    const fetchEventListener = (event: MessageEvent) => {
      switch (event.data.type) {
        case "database::save::citybus::route":
        case "database::save::citybus::stop":
        case "database::save::citybus::route-stop":
        case "database::save::kmb::route":
        case "database::save::kmb::stop":
        case "database::save::kmb::route-stop":
        case "database::save::gmb::route":
        case "database::save::gmb::stop":
        case "database::save::gmb::route-stop":
          dbWorker.postMessage(event.data);
          break;
      }
    };

    const dbEventListener = (event: MessageEvent) => {
      if (event.data.type === "pong") {
        clearInterval(intervalId);
        dbWorker.postMessage({ type: "database::check-empty" });
        setUp(true);
      }

      if (event.data.type === "result::database::check-empty") {
        if (event.data.data) {
          fetchWorker.postMessage({ type: "fetch::update" });
        } else {
          setReady(true);
        }
      }
    };

    fetchWorker.addEventListener("message", fetchEventListener);
    dbWorker.addEventListener("message", dbEventListener);

    return () => {
      clearInterval(intervalId);
      fetchWorker.removeEventListener("message", fetchEventListener);
      dbWorker.removeEventListener("message", dbEventListener);
    };
  }, []);

  return { up, ready, setReady };
};

export default useDatabase;
