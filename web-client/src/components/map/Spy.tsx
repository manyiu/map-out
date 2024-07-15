import { useEffect } from "react";
import { useMapEvents } from "react-leaflet";
import { useBoundsStore } from "../../stores/bounds";
import { sqliteWorker } from "../../workers";

interface SpyProps {
  ready: boolean;
}

const Spy = ({ ready }: SpyProps) => {
  const setBounds = useBoundsStore((state) => state.setBounds);

  const map = useMapEvents({
    dragend: () => {
      setBounds(map.getBounds());

      sqliteWorker.postMessage({
        type: "map-bounds",
        data: map.getBounds(),
      });
    },
    zoomend: () => {
      setBounds(map.getBounds());

      sqliteWorker.postMessage({
        type: "map-bounds",
        data: map.getBounds(),
      });
    },
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (ready) {
        sqliteWorker.postMessage({
          type: "ping",
        });
      }
    }, 1000);

    sqliteWorker.addEventListener("message", (event) => {
      if (event.data.type === "pong") {
        setBounds(map.getBounds());

        sqliteWorker.postMessage({
          type: "map-bounds",
          data: map.getBounds(),
        });

        clearInterval(intervalId);
      }
    });

    return () => {
      clearInterval(intervalId);
    };
  }, [map, ready, setBounds]);

  return null;
};

export default Spy;
