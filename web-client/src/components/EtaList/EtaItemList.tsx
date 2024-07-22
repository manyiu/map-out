import { TimeIcon } from "@chakra-ui/icons";
import {
  Badge,
  Card,
  CardBody,
  HStack,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { KmbStopEta } from "../../api/types";
import useGeolocation from "../../hooks/useGeolocation";
import useKmbStopEta from "../../hooks/useKmbStopEta";
import useNearByKmb from "../../hooks/useNearByKmb";
import { usePreferenceStore } from "../../stores/preference";
import Countdown from "../Countdown";

const EtaItemList = () => {
  const geolocation = useGeolocation();
  const language = usePreferenceStore((state) => state.language);
  const { stop: stopKmbs } = useNearByKmb();
  const { data: kmbEtas } = useKmbStopEta(stopKmbs.map((stop) => stop.stop));

  const reducedKmbEtas = kmbEtas.reduce(
    (acc, curr) => {
      const newAcc = {
        exists: { ...acc.exists },
        reduced: [...acc.reduced],
      };

      if (
        stopKmbs.find((stop) => stop.stop === curr.stop) &&
        curr.eta &&
        !acc.exists[`${curr.route}-${curr.dir}-${curr.eta_seq}`]
      ) {
        newAcc.exists[`${curr.route}-${curr.dir}-${curr.eta_seq}`] = true;
        newAcc.reduced.push(curr);
      }

      return newAcc;
    },
    {
      exists: {},
      reduced: [],
    } as {
      exists: {
        [key: string]: boolean;
      };
      reduced: (KmbStopEta & { stop: string })[];
    }
  ).reduced;

  const sortedKmbEtas = reducedKmbEtas.sort((a, b) => {
    const aStop = stopKmbs.find((stop) => stop.stop === a.stop);
    const bStop = stopKmbs.find((stop) => stop.stop === b.stop);

    if (!geolocation.geolocation || !aStop || !bStop) {
      return new Date(a.eta!).getTime() - new Date(b.eta!).getTime();
    }

    const aDistance =
      (aStop.lat - geolocation.geolocation?.coords.latitude) ^
      (2 + (aStop.long - geolocation.geolocation?.coords.longitude)) ^
      2;
    const bDistance =
      (bStop.lat - geolocation.geolocation?.coords.latitude) ^
      (2 + (bStop.long - geolocation.geolocation?.coords.longitude)) ^
      2;

    return (
      aDistance - bDistance ||
      new Date(a.eta!).getTime() - new Date(b.eta!).getTime()
    );
  });

  return sortedKmbEtas.map((eta) => {
    const stop = stopKmbs.find((stop) => stop.stop === eta.stop);
    const stopName = stop?.[`name_${language}`];

    return (
      <Card key={`eta-list-${eta.stop}-${eta.route}-${eta.eta_seq}-${eta.eta}`}>
        <CardBody>
          <Stack>
            <Text>{stopName}</Text>
            <HStack>
              <Badge variant="outline" colorScheme="red">
                <Text fontSize="large">{eta.route}</Text>
              </Badge>
              <Tag>{eta?.[`dest_${language}`]}</Tag>
              <TimeIcon /> <Countdown eta={eta.eta!} />
            </HStack>
          </Stack>
        </CardBody>
      </Card>
    );
  });
};

export default EtaItemList;
