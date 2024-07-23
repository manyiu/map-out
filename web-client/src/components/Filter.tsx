import { ViewIcon } from "@chakra-ui/icons";
import {
  Button,
  Card,
  Checkbox,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import { useLocationFilterStore } from "../stores/locationFilter";
import { usePreferenceStore } from "../stores/preference";

const i18n = {
  header: {
    en: "Display Filter",
    tc: "過濾圖示",
    sc: "过滤图示",
  },
  transportations: {
    en: "Transportations",
    tc: "交通工具",
    sc: "交通工具",
  },
  kmb: {
    en: "KMB",
    tc: "九巴",
    sc: "九巴",
  },
  citybus: {
    en: "Citybus",
    tc: "城巴",
    sc: "城巴",
  },
  gmb: {
    en: "GMB",
    tc: "綠色小巴",
    sc: "绿色小巴",
  },
  rmv: {
    en: "Reverse Vending Machines",
    tc: "入樽機",
    sc: "入樽机",
  },
};

const Filter = () => {
  const language = usePreferenceStore((state) => state.language);
  const state = useLocationFilterStore();
  const { isOpen, onToggle, onClose } = useDisclosure();

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{i18n.header[language]}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack>
              <Checkbox
                isChecked={state.citybus && state.kmb && state.gmb}
                isIndeterminate={
                  (state.citybus || state.kmb || state.gmb) &&
                  !(state.citybus && state.kmb && state.gmb)
                }
                onChange={(event) =>
                  state.setTransportation(event.target.checked)
                }
              >
                {i18n.transportations[language]}
              </Checkbox>
              <HStack pl={6}>
                <Checkbox
                  isChecked={state.kmb}
                  onChange={(event) => state.setKmb(event.target.checked)}
                >
                  {i18n.kmb[language]}
                </Checkbox>
                <Checkbox
                  isChecked={state.citybus}
                  onChange={(event) => state.setCitybus(event.target.checked)}
                >
                  {i18n.citybus[language]}
                </Checkbox>
                <Checkbox
                  isChecked={state.gmb}
                  onChange={(event) => state.setGmb(event.target.checked)}
                >
                  {i18n.gmb[language]}
                </Checkbox>
              </HStack>
              <Checkbox
                isChecked={state.rvm}
                onChange={(event) => state.setRvm(event.target.checked)}
              >
                {i18n.rmv[language]}
              </Checkbox>
            </Stack>
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
          <ViewIcon />
        </Button>
      </Card>
    </>
  );
};

export default Filter;
