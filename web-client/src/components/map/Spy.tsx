import { useEffect } from "react";
import { useMapEvents } from "react-leaflet";
import { useBoundsStore } from "../../stores/bounds";
import worker from "../../workers";

interface SpyProps {
  ready: boolean;
}

const Spy = ({ ready }: SpyProps) => {
  const setBounds = useBoundsStore((state) => state.setBounds);

  const map = useMapEvents({
    moveend: () => {
      setBounds(map.getBounds());

      worker.postMessage({
        type: "map-bounds",
        data: map.getBounds(),
      });
    },
    zoomend: () => {
      setBounds(map.getBounds());

      worker.postMessage({
        type: "map-bounds",
        data: map.getBounds(),
      });
    },
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (ready) {
        worker.postMessage({
          type: "ping",
        });
      }
    }, 1000);

    worker.addEventListener("message", (event) => {
      if (event.data.type === "pong") {
        setBounds(map.getBounds());

        worker.postMessage({
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
