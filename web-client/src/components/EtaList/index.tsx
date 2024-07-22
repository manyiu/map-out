import { CalendarIcon } from "@chakra-ui/icons";
import {
  Button,
  Card,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { usePreferenceStore } from "../../stores/preference";
import EtaItemList from "./EtaItemList";

const i18n = {
  kmb: {
    en: "KMB",
    tc: "九巴",
    sc: "九巴",
  },
  list: {
    en: "List",
    tc: "列表",
    sc: "列表",
  },
  helperText: {
    en: "Other list will be available soon",
    tc: "其他列表即將推出",
    sc: "其他列表即将推出",
  },
};

const EtaList = () => {
  const language = usePreferenceStore((state) => state.language);
  const { isOpen, onToggle, onClose } = useDisclosure();

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {i18n.kmb[language]}
            {i18n.list[language]}
            <Text fontSize="sm">{i18n.helperText[language]}</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <EtaItemList />
          </ModalBody>
        </ModalContent>
      </Modal>
      <Card
        style={{
          position: "absolute",
          left: 12,
          bottom: 60,
          zIndex: 401,
          width: 52,
        }}
      >
        <Button onClick={onToggle}>
          <CalendarIcon />
        </Button>
      </Card>
    </>
  );
};

export default EtaList;
