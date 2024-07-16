import { TimeIcon } from "@chakra-ui/icons";
import {
  Badge,
  Card,
  CardBody,
  HStack,
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
import useKmbStopEta from "../../hooks/useKmbStopEta";
import { StopKmb } from "../../repositories/types";
import Countdown from "../Countdown";

interface KmbStopEtaProps {
  stop: StopKmb | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const KmtStopEta = (props: KmbStopEtaProps) => {
  const { data, isLoading, isError } = useKmbStopEta(props.stop?.stop || null);

  if (isLoading || !data || isError || data.length === 0) {
    return null;
  }

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{props.stop?.name_tc}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {data
            .filter((eta) => !!eta.eta)
            .sort((a, b) => (a.eta! > b.eta! ? 1 : -1))
            .map((eta) => (
              <Card
                key={`${eta.co}-${eta.route}-${eta.service_type}-${eta.dir}-${eta.eta_seq}`}
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
                      {!eta.rmk_tc && <TimeIcon />}
                      {eta.rmk_tc && <Tag>{eta.rmk_tc}</Tag>}
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
