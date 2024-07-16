import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import useGeolocation from "../../hooks/useGeolocation";
import useNearByCitybus from "../../hooks/useNearByCitybus";
// import useNearByGmb from "../../hooks/useNearByGmb";
import { ArrowRightIcon } from "@chakra-ui/icons";
import {
  Button,
  Center,
  CircularProgress,
  Grid,
  GridItem,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import useNearByKmb from "../../hooks/useNearByKmb";
import { StopKmb } from "../../repositories/types";
import { Language, usePreferenceStore } from "../../stores/preference";
import KmbStopEta from "./KmbStopEta";
import Spy from "./Spy";
import { MapProps, SourceAttribution, SourceUrl } from "./types";

const Map = (props: MapProps) => {
  const [ready, setReady] = useState(false);
  const [selectedKmbStop, setSelectedKmbStop] = useState<StopKmb | null>(null);
  // const [selectedCitybusStop, setSelectedCitybusStop] =
  //   useState<StopCitybus | null>(null);

  const {
    isOpen: isKmbOpen,
    onOpen: onKmbOpen,
    onClose: onKmbClose,
  } = useDisclosure();

  // const {
  //   isOpen: isCitybusOpen,
  //   onOpen: onCitybusOpen,
  //   onClose: onCitybusClose,
  // } = useDisclosure();

  const { geolocation } = useGeolocation();
  const { stop: stopKmb } = useNearByKmb();
  const { stop: stopCitybus } = useNearByCitybus();
  const language = usePreferenceStore((state) => state.language);
  // const { dataGroupedByStop } = useNearByGmb();

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
              You must share your location to use the map mode.
            </Text>
          </GridItem>
          <GridItem>
            <Button
              leftIcon={<ArrowRightIcon />}
              colorScheme="teal"
              variant="solid"
            >
              Switch to List Mode
            </Button>
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
            eventHandlers={{
              click: () => {
                setSelectedKmbStop(stop);
                onKmbOpen();
              },
            }}
          >
            <Popup>
              {language === Language.ZH_HK
                ? stop.name_tc
                : language === Language.ZH_CN
                ? stop.name_sc
                : stop.name_en}
            </Popup>
          </Marker>
        ))}
        {stopCitybus.map((stop) => (
          <Marker key={stop.stop} position={[stop.lat, stop.long]}>
            <Popup>
              {language === Language.ZH_HK
                ? stop.name_tc
                : language === Language.ZH_CN
                ? stop.name_sc
                : stop.name_en}
            </Popup>
          </Marker>
        ))}
        {/* {dataGroupedByStop.map((stop) => (
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
            ))} */}
      </MapContainer>
    </>
  );
};

export default Map;
