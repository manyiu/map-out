import { useMapEvents } from "react-leaflet";
import worker from "../../workers";

const Spy = () => {
  const map = useMapEvents({
    moveend: () => {
      worker.postMessage({
        type: "map-bounds",
        data: map.getBounds(),
      });
    },
    zoomend: () => {
      worker.postMessage({
        type: "map-bounds",
        data: map.getBounds(),
      });
    },
  });

  return null;
};

export default Spy;
