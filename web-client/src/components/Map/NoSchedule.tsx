import { WarningIcon } from "@chakra-ui/icons";
import {
  Card,
  CardBody,
  CardHeader,
  Center,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react";
import { usePreferenceStore } from "../../stores/preference";

interface NoScheduleProps {
  header?: string;
  isOpen: boolean;
  onClose: () => void;
}

const i18n = {
  noBus: {
    en: "Not In Service",
    sc: "暂无班次",
    tc: "暫無班次",
  },
};

const NoSchedule = (props: NoScheduleProps) => {
  const language = usePreferenceStore((state) => state.language);

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{props.header}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Card>
            <CardHeader>
              <Center>
                <WarningIcon boxSize={10} />
              </Center>
            </CardHeader>
            <CardBody>
              <Center>
                <Text>{i18n.noBus[language]}</Text>
              </Center>
            </CardBody>
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NoSchedule;
