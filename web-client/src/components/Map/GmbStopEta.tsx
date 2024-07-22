import { TimeIcon } from "@chakra-ui/icons";
import {
  Badge,
  Card,
  CardBody,
  HStack,
  Kbd,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import useGmbStopEta from "../../hooks/useGmbStopEta";
import { GmbRoute, GmbStop } from "../../repositories/types";
import { usePreferenceStore } from "../../stores/preference";
import { dbWorker } from "../../workers";
import Countdown from "../Countdown";
import NoSchedule from "./NoSchedule";

interface GmbStopEtaProps {
  stop: GmbStop | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const GmbStopEta = (props: GmbStopEtaProps) => {
  const [routes, setRoutes] = useState<{ [key: string]: GmbRoute }>({});
  const { data, isLoading } = useGmbStopEta(
    props.isOpen && props.stop?.stop ? [props.stop.stop] : null
  );
  const language = usePreferenceStore((state) => state.language);

  useEffect(() => {
    const eventListener = (event: MessageEvent) => {
      if (
        event.data.type === "result::database::get::gmb::get-route-by-id-seq"
      ) {
        const map: { [key: string]: GmbRoute } = {};

        for (const route of event.data.data as GmbRoute[]) {
          map[route.route_id + "_" + route.route_seq] = route;
        }

        setRoutes(map);
      }
    };

    dbWorker.addEventListener("message", eventListener);

    if (data && data.length > 0) {
      dbWorker.postMessage({
        type: "database::get::gmb::get-route-by-id-seq",
        data: data.map((eta) => ({ id: eta.route_id, seq: eta.route_seq })),
      });
    }

    return () => {
      dbWorker.removeEventListener("message", eventListener);
    };
  }, [data]);

  if (isLoading) {
    return null;
  }

  if (data.length === 0) {
    return <NoSchedule isOpen={props.isOpen} onClose={props.onClose} />;
  }

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader></ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {data
            .sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            )
            .map((eta) => (
              <Card
                key={`eta-gmb-${eta.route_id}-${eta.route_seq}-${eta.eta_seq}-${eta.timestamp}`}
              >
                <CardBody>
                  <Stack>
                    <HStack>
                      <Badge variant="outline" colorScheme="green">
                        <Text fontSize="large">
                          {
                            routes[eta.route_id + "_" + eta.route_seq]
                              ?.route_code
                          }
                        </Text>
                      </Badge>
                      <Tag>
                        {
                          routes[eta.route_id + "_" + eta.route_seq]?.[
                            `dest_${language}`
                          ]
                        }
                      </Tag>
                    </HStack>
                    <HStack>
                      {eta.remarks_tc && (
                        <Kbd>{eta?.[`remarks_${language}`]}</Kbd>
                      )}
                      <TimeIcon />
                      <Countdown eta={eta.timestamp} />
                    </HStack>
                  </Stack>
                </CardBody>
              </Card>
            ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GmbStopEta;
