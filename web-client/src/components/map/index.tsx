import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import useGeolocation from "../../hooks/useGeolocation";
import useNearByCitybus from "../../hooks/useNearByCitybus";
import useNearByGmb from "../../hooks/useNearByGmb";
import useNearByKmb from "../../hooks/useNearByKmb";
import Spy from "./Spy";
import { MapProps, SourceAttribution, SourceUrl } from "./types";

const Map = (props: MapProps) => {
  const [ready, setReady] = useState(false);
  const { geolocation } = useGeolocation();
  const { stop: stopKmb } = useNearByKmb();
  const { stop: stopCitybus } = useNearByCitybus();
  useNearByGmb();

  if (!geolocation) {
    return null;
  }

  return (
    <MapContainer
      style={{ height: "100dvh", width: "100%" }}
      center={[geolocation?.coords.latitude, geolocation?.coords.longitude]}
      zoom={props.zoom}
      scrollWheelZoom={"center"}
      whenReady={() => setReady(true)}
    >
      <Spy ready={ready} />
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
