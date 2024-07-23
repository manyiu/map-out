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
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { RvmItem } from "../../api/types";
import useGeolocation from "../../hooks/useGeolocation";
import useNearByCitybus from "../../hooks/useNearByCitybus";
import useNearByGmb from "../../hooks/useNearByGmb";
import useNearByKmb from "../../hooks/useNearByKmb";
import useRvm from "../../hooks/useRvm";
import { GmbStop, StopCitybus, StopKmb } from "../../repositories/types";
import { useLocationFilterStore } from "../../stores/locationFilter";
import { usePreferenceStore } from "../../stores/preference";
import CitybusStopEta from "./CitybusStopEta";
import GmbStopEta from "./GmbStopEta";
import CitybusIcon from "./Icons/Citybus";
import GmbIcon from "./Icons/Gmb";
import KmbIcon from "./Icons/Kmb";
import rvmIcon from "./Icons/Rvm";
import KmbStopEta from "./KmbStopEta";
import Rvm from "./Rvm";
import Spy from "./Spy";
import { Source, SourceAttribution, SourceUrl } from "./types";
import ZoomAlert from "./ZoomAlert";

const i18n = {
  loading: {
    en: "Loading your location...",
    tc: "載入您的位置...",
    sc: "载入您的位置...",
  },
  locationRequired: {
    en: "You must share your location to use the app.",
    tc: "您必須分享您的位置才能使用應用程式。",
    sc: "您必须分享您的位置才能使用应用程序。",
  },
};

const Map = () => {
  const [ready, setReady] = useState(false);
  const [selectedKmbStop, setSelectedKmbStop] = useState<StopKmb | null>(null);
  const [selectedCitybusStop, setSelectedCitybusStop] =
    useState<StopCitybus | null>(null);
  const [selectedGmbStop, setSelectedGmbStop] = useState<GmbStop | null>(null);
  const [selectedRvm, setSelectedRvm] = useState<RvmItem | null>(null);
  const language = usePreferenceStore((state) => state.language);
  const source = usePreferenceStore((state) => state.source);
  const kmbFilter = useLocationFilterStore((state) => state.kmb);
  const citybusFilter = useLocationFilterStore((state) => state.citybus);
  const gmbFilter = useLocationFilterStore((state) => state.gmb);
  const rvmFilter = useLocationFilterStore((state) => state.rvm);

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

  const {
    isOpen: isGmbOpen,
    onOpen: onGmbOpen,
    onClose: onGmbClose,
  } = useDisclosure();

  const { geolocation } = useGeolocation();
  const { stop: stopKmb } = useNearByKmb();
  const { stop: stopCitybus } = useNearByCitybus();
  const { stop: stopGmb } = useNearByGmb();
  const { data: rvm } = useRvm();

  if (!geolocation) {
    return (
      <Center width="100%" height="100dvh">
        <Grid rowGap={5} textAlign="center">
          <GridItem>
            <CircularProgress isIndeterminate color="blue.300" />
          </GridItem>
          <GridItem>
            <Text>{i18n.loading[language]}</Text>
            <Text fontSize="xs">{i18n.locationRequired[language]}</Text>
          </GridItem>
        </Grid>
      </Center>
    );
  }

  return (
    <>
      <ZoomAlert />
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

      <GmbStopEta
        stop={selectedGmbStop}
        isOpen={isGmbOpen}
        onOpen={onGmbOpen}
        onClose={onGmbClose}
      />

      <Rvm
        rvm={selectedRvm}
        isOpen={!!selectedRvm}
        onOpen={() => {}}
        onClose={() => setSelectedRvm(null)}
      />

      <MapContainer
        style={{ height: "100dvh", width: "100%" }}
        center={[geolocation?.coords.latitude, geolocation?.coords.longitude]}
        zoom={18}
        scrollWheelZoom={"center"}
        whenReady={() => setReady(true)}
      >
        <Spy ready={ready} />
        <TileLayer
          attribution={
            SourceAttribution[source as keyof typeof SourceAttribution]
          }
          url={SourceUrl[source as keyof typeof SourceUrl]}
          crossOrigin={"anonymous"}
        />
        {(source === Source.LandsDTopographicMap ||
          source === Source.LandsDImageryMap) && (
          <TileLayer
            url={SourceUrl.LandsDMapLabel.replace("[language]", language)}
            crossOrigin={"anonymous"}
          />
        )}
        {kmbFilter &&
          stopKmb.map((stop) => (
            <Marker
              key={stop.stop}
              position={[stop.lat, stop.long]}
              icon={KmbIcon}
              eventHandlers={{
                click: () => {
                  setSelectedKmbStop(stop);
                  onKmbOpen();
                },
              }}
            ></Marker>
          ))}
        {citybusFilter &&
          stopCitybus.map((stop) => (
            <Marker
              key={stop.stop}
              position={[stop.lat, stop.long]}
              icon={CitybusIcon}
              eventHandlers={{
                click: () => {
                  setSelectedCitybusStop(stop);
                  onCitybusOpen();
                },
              }}
            ></Marker>
          ))}
        {gmbFilter &&
          stopGmb.map((stop) => (
            <Marker
              key={stop.stop}
              position={[stop.lat, stop.long]}
              icon={GmbIcon}
              eventHandlers={{
                click: () => {
                  setSelectedGmbStop(stop);
                  onGmbOpen();
                },
              }}
            ></Marker>
          ))}
        {rvmFilter &&
          rvm?.map((item) => (
            <Marker
              key={item.id}
              position={[item.coordinates[0], item.coordinates[1]]}
              icon={rvmIcon}
              eventHandlers={{
                click: () => {
                  setSelectedRvm(item);
                },
              }}
            ></Marker>
          ))}
      </MapContainer>
    </>
  );
};

export default Map;
