import {
  Center,
  CircularProgress,
  Grid,
  GridItem,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import useGeolocation from "../../hooks/useGeolocation";
import useNearByCitybus from "../../hooks/useNearByCitybus";
import useNearByGmb from "../../hooks/useNearByGmb";
import useNearByKmb from "../../hooks/useNearByKmb";
import { StopCitybus, StopKmb } from "../../repositories/types";
import CitybusStopEta from "./CitybusStopEta";
import citybusIcon from "./icons/citybus";
import gmbIcon from "./icons/gmb";
import kmbIcon from "./icons/kmb";
import KmbStopEta from "./KmbStopEta";
import Spy from "./Spy";
import { MapProps, SourceAttribution, SourceUrl } from "./types";

const Map = (props: MapProps) => {
  const [ready, setReady] = useState(false);
  const [selectedKmbStop, setSelectedKmbStop] = useState<StopKmb | null>(null);
  const [selectedCitybusStop, setSelectedCitybusStop] =
    useState<StopCitybus | null>(null);

  const {
    isOpen: isKmbOpen,
    onOpen: onKmbOpen,
    onClose: onKmbClose,
  } = useDisclosure();

  const {
    isOpen: isCitybusOpen,
    onOpen: onCitybusOpen,
    onClose: onCitybusClose,
  } = useDisclosure();

  const { geolocation } = useGeolocation();
  const { stop: stopKmb } = useNearByKmb();
  const { stop: stopCitybus } = useNearByCitybus();
  const { stop: stopGmb } = useNearByGmb();

  if (!geolocation) {
    return (
      <Center width="100%" height="100dvh">
        <Grid rowGap={5} textAlign="center">
          <GridItem>
            <CircularProgress isIndeterminate color="blue.300" />
          </GridItem>
          <GridItem>
            <Text>Loading your location...</Text>
            <Text fontSize="xs">
              You must share your location to use the app.
            </Text>
          </GridItem>
        </Grid>
      </Center>
    );
  }

  return (
    <>
      <KmbStopEta
        stop={selectedKmbStop}
        isOpen={isKmbOpen}
        onOpen={onKmbOpen}
        onClose={onKmbClose}
      />

      <CitybusStopEta
        stop={selectedCitybusStop}
        isOpen={isCitybusOpen}
        onOpen={onCitybusOpen}
        onClose={onCitybusClose}
      />

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
          <Marker
            key={stop.stop}
            position={[stop.lat, stop.long]}
            icon={kmbIcon}
            eventHandlers={{
              click: () => {
                setSelectedKmbStop(stop);
                onKmbOpen();
              },
            }}
          ></Marker>
        ))}
        {stopCitybus.map((stop) => (
          <Marker
            key={stop.stop}
            position={[stop.lat, stop.long]}
            icon={citybusIcon}
            eventHandlers={{
              click: () => {
                setSelectedCitybusStop(stop);
                onCitybusOpen();
              },
            }}
          ></Marker>
        ))}
        {stopGmb.map((stop) => (
          <Marker
            key={stop.stop}
            position={[stop.lat, stop.long]}
            icon={gmbIcon}
          >
            <Popup>
              <Text>{stop.stop}</Text>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
};

export default Map;
