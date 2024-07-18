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
  Skeleton,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import useCitybusStopEta from "../../hooks/useCitybusStopEta";
import { StopCitybus } from "../../repositories/types";
import { usePreferenceStore } from "../../stores/preference";
import Countdown from "../Countdown";
import NoSchedule from "./NoSchedule";

interface CitybusStopEtaProps {
  stop: StopCitybus | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const CitybusStopEta = (props: CitybusStopEtaProps) => {
  const language = usePreferenceStore((state) => state.language);

  const { data, isLoading, isError } = useCitybusStopEta(
    props.isOpen ? props.stop?.stop || null : null
  );

  if (isError) {
    return (
      <Modal isOpen={props.isOpen} onClose={props.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{props.stop?.[`name_${language}`]}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>Failed to fetch data</ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  if (isLoading) {
    const skeletons = [];

    for (let i = 0; i < 5; i++) {
      skeletons.push(
        <Card key={`skeleton-${i}`}>
          <CardBody>
            <Stack>
              <Skeleton>
                <HStack>
                  <Badge variant="outline" colorScheme="red">
                    <Text fontSize="large"></Text>
                  </Badge>
                  <Tag></Tag>
                </HStack>
              </Skeleton>
              <Skeleton>
                <HStack>
                  <Kbd></Kbd>
                  <TimeIcon />
                </HStack>
              </Skeleton>
            </Stack>
          </CardBody>
        </Card>
      );
    }

    return (
      <Modal isOpen={props.isOpen} onClose={props.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{props.stop?.[`name_${language}`]}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{skeletons}</ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  if (data.length === 0) {
    return (
      <NoSchedule
        header={props.stop?.[`name_${language}`]}
        isOpen={props.isOpen}
        onClose={props.onClose}
      />
    );
  }

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{props.stop?.[`name_${language}`]}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {data.map((eta) => (
            <Card key={`eta-${eta.co}-${eta.route}-${eta.dir}-${eta.eta_seq}`}>
              <CardBody>
                <Stack>
                  <HStack>
                    <Badge variant="outline" colorScheme="red">
                      <Text fontSize="large">{eta.route}</Text>
                    </Badge>
                    <Tag>{eta?.[`dest_${language}`]}</Tag>
                  </HStack>
                  <HStack>
                    {eta[`rmk_${language}`] && (
                      <Kbd>{eta[`rmk_${language}`]}</Kbd>
                    )}
                    <TimeIcon />
                    <Countdown eta={eta.eta!} />
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

export default CitybusStopEta;
