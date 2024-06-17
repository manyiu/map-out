import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import useNearByCitybus from "../../hooks/useNearByCitybus";
import useNearByKmb from "../../hooks/useNearByKmb";
import Spy from "./Spy";
import { MapProps, SourceAttribution, SourceUrl } from "./types";

const Map = (props: MapProps) => {
  const { stop: stopKmb } = useNearByKmb();
  const { stop: stopCitybus } = useNearByCitybus();

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
      <Spy />
      <TileLayer
        attribution={SourceAttribution[props.source]}
        url={SourceUrl[props.source]}
      />
      {props.zoom >= 18 &&
        stopKmb.map((stop) => (
          <Marker key={stop.stop} position={[stop.lat, stop.long]}>
            <Popup>{stop.name_en}</Popup>
          </Marker>
        ))}
      {props.zoom >= 18 &&
        stopCitybus.map((stop) => (
          <Marker key={stop.stop} position={[stop.lat, stop.long]}>
            <Popup>{stop.name_en}</Popup>
          </Marker>
        ))}
    </MapContainer>
  );
};

export default Map;
