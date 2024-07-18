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
import useKmbStopEta from "../../hooks/useKmbStopEta";
import { StopKmb } from "../../repositories/types";
import { Language, usePreferenceStore } from "../../stores/preference";
import Countdown from "../Countdown";

interface KmbStopEtaProps {
  stop: StopKmb | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const KmtStopEta = (props: KmbStopEtaProps) => {
  const language = usePreferenceStore((state) => {
    switch (state.language) {
      case Language.EN:
        return "en";
      case Language.ZH_CN:
        return "sc";
      case Language.ZH_HK:
      default:
        return "tc";
    }
  });

  const { data, isLoading, isError } = useKmbStopEta(
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

  if (data?.length === 0 || data?.filter((eta) => !!eta.eta).length === 0) {
    return (
      <Modal isOpen={props.isOpen} onClose={props.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{props.stop?.[`name_${language}`]}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Card>
              <Text>No upcoming bus</Text>
            </Card>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{props.stop?.name_tc}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {data
            ?.filter((eta) => !!eta.eta)
            .sort((a, b) => (a.eta! > b.eta! ? 1 : -1))
            .map((eta) => (
              <Card
                key={`eta-${eta.co}-${eta.route}-${eta.service_type}-${eta.dir}-${eta.eta_seq}`}
              >
                <CardBody>
                  <Stack>
                    <HStack>
                      <Badge variant="outline" colorScheme="red">
                        <Text fontSize="large">{eta.route}</Text>
                      </Badge>
                      <Tag>{eta.dest_tc}</Tag>
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

export default KmtStopEta;
