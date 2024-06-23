import { Card, CardBody, CardHeader } from "@chakra-ui/react";
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
  const { dataGroupedByStop } = useNearByGmb();

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
        crossOrigin={"anonymous"}
      />
      {stopKmb.map((stop) => (
        <Marker key={stop.stop} position={[stop.lat, stop.long]}>
          <Popup>{stop.name_en}</Popup>
        </Marker>
      ))}
      {stopCitybus.map((stop) => (
        <Marker key={stop.stop} position={[stop.lat, stop.long]}>
          <Popup>{stop.name_en}</Popup>
        </Marker>
      ))}
      {dataGroupedByStop.map((stop) => (
        <Marker key={stop.stopId} position={[stop.lat, stop.long]}>
          <Popup>
            {stop.routes.map((route) => (
              <Card key={`${route.routeId}-${route.routeSeq}-${route.stopSeq}`}>
                <CardHeader>{route.routeCode}</CardHeader>
                <CardBody>
                  <p>{route.description.en}</p>
                  <p>{route.description.tc}</p>
                  <p>
                    {route.direction.orig.en} - {route.direction.dest.en}
                  </p>
                  <p>{route.stopName.en}</p>
                  <ul>
                    {route.eta.map((eta) => (
                      <li key={eta.etaSeq}>
                        <h3>{eta.etaSeq}</h3>
                        <p>{eta.diff}</p>
                        <p>{eta.timestamp}</p>
                        <p>{eta.remarks.en}</p>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ))}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
