import { DataWrapper, RouteCitybus, RouteStopKmb } from "../api/types";
import { MessageEventData } from "./types";

const main = async () => {
  self.addEventListener(
    "message",
    async (event: MessageEvent<MessageEventData>) => {
      if (event.data.type === "fetch::kmb") {
        const routeStopPromise = async () => {
          const routeStopResponse = await fetch(
            "https://data.etabus.gov.hk/v1/transport/kmb/route-stop"
          );

          if (!routeStopResponse.ok) {
            self.postMessage({
              type: "error::fetch::kmb::route-stop",
              data: routeStopResponse.statusText,
            } as MessageEventData);
          }

          const routeStopResponseJson =
            (await routeStopResponse.json()) as DataWrapper<RouteStopKmb[]>;

          self.postMessage({
            type: "response::fetch::kmb::route-stop",
            data: routeStopResponseJson.data,
          } as MessageEventData);
        };

        const stopPromise = async () => {
          const stopResponse = await fetch(
            "https://data.etabus.gov.hk/v1/transport/kmb/stop"
          );

          if (!stopResponse.ok) {
            self.postMessage({
              type: "error::fetch::kmb::stop",
              data: stopResponse.statusText,
            } as MessageEventData);
          }

          const stopResponseJson = (await stopResponse.json()) as DataWrapper<
            RouteStopKmb[]
          >;

          self.postMessage({
            type: "response::fetch::kmb::stop",
            data: stopResponseJson.data,
          } as MessageEventData);
        };

        await Promise.all([routeStopPromise(), stopPromise()]);
      }

      if (event.data.type === "fetch::citybus") {
        const routeResponse = await fetch(
          "https://rt.data.gov.hk/v2/transport/citybus/route/ctb"
        );

        if (!routeResponse.ok) {
          self.postMessage({
            type: "error::fetch::citybus::route",
            data: routeResponse.statusText,
          } as MessageEventData);
        }

        const routeResponseJson = (await routeResponse.json()) as DataWrapper<
          RouteCitybus[]
        >;

        self.postMessage({
          type: "response::fetch::citybus::route",
          data: routeResponseJson.data,
        } as MessageEventData);
      }

      if (event.data.type === "fetch::gmb") {
        console.log("fetch::gmb");
      }
    }
  );
};

main();
