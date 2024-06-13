import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { MapProps, SourceAttribution, SourceUrl } from "./types";

const MyComponent = () => {
  const map = useMapEvents({
    moveend: () => {
      console.log("Map new bounds: ", map.getBounds());
    },
    zoomend: () => {
      console.log("Map new bounds: ", map.getBounds());
    },
  });

  return null;
};

const Map = (props: MapProps) => {
  if (!props.position) {
    return null;
  }

  return (
    <MapContainer
      style={{ height: "100dvh", width: "100%" }}
      center={[
        props.position?.coords.latitude,
        props.position?.coords.longitude,
      ]}
      zoom={props.zoom}
      scrollWheelZoom={"center"}
    >
      <MyComponent />
      <TileLayer
        attribution={SourceAttribution[props.source]}
        url={SourceUrl[props.source]}
      />
      <Marker
        position={[
          props.position?.coords.latitude,
          props.position?.coords.longitude,
        ]}
      >
        <Popup>Current Location</Popup>
      </Marker>
    </MapContainer>
  );
};

export default Map;
