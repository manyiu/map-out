import {
  Card,
  CardBody,
  CardFooter,
  CircularProgress,
  CircularProgressLabel,
  Divider,
  HStack,
  Image,
  Kbd,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";
import { RvmItem, RvmItemStatus } from "../../api/types";
import { usePreferenceStore } from "../../stores/preference";

const i18n = {
  rvm: {
    en: "Reverse Vending Machine",
    tc: "入樽機",
    sc: "入樽机",
  },
  operating: {
    en: "Operating",
    tc: "運作中",
    sc: "运作中",
  },
  notInService: {
    en: "Not In Service",
    tc: "停止服務",
    sc: "停止服务",
  },
  bottleCountInMachine: {
    en: "Bottle Count In Machine",
    tc: "機內瓶數",
    sc: "机内瓶数",
  },
  status5: {
    en: "Less than 5% available",
    tc: "少於5%可用",
    sc: "少于5%可用",
  },
  status20: {
    en: "Less than 20% available",
    tc: "少於20%可用",
    sc: "少于20%可用",
  },
  status40: {
    en: "Less than 40% available",
    tc: "少於40%可用",
    sc: "少于40%可用",
  },
  status60: {
    en: "More than 40% available",
    tc: "超過40%可用",
    sc: "超过40%可用",
  },
  statusFull: {
    en: "Full",
    tc: "已滿",
    sc: "已满",
  },
  fullSoon: {
    en: "Full Soon",
    tc: "即將滿機",
    sc: "即将满机",
  },
  lastFull: {
    en: "Last Full",
    tc: "上次已滿時間",
    sc: "上次已满时间",
  },
  lastEmptied: {
    en: "Last Emptied",
    tc: "上次清空時間",
    sc: "上次清空时间",
  },
};

interface RvmProps {
  rvm: RvmItem | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const Rvm = (props: RvmProps) => {
  const language = usePreferenceStore((state) => state.language);
  const rvmLanguage = usePreferenceStore((state) => {
    switch (state.language) {
      case "en":
        return "en";
      case "sc":
        return "zhs";
      case "tc":
      default:
        return "zht";
    }
  });

  if (!props.rvm) {
    return null;
  }

  const fullPercentage = (() => {
    switch (props.rvm?.status) {
      case RvmItemStatus["<=5%"]:
        return 95;
      case RvmItemStatus["<=20%"]:
        return 80;
      case RvmItemStatus["<=40%"]:
        return 60;
      case RvmItemStatus[">40%"]:
        return 40;
      case RvmItemStatus["Full"]:
        return 100;
    }
  })();

  const fullPercentageColor = (() => {
    switch (props.rvm?.status) {
      case RvmItemStatus["<=5%"]:
        return "red";
      case RvmItemStatus["<=20%"]:
        return "orange";
      case RvmItemStatus["<=40%"]:
        return "yellow";
      case RvmItemStatus[">40%"]:
        return "green";
      case RvmItemStatus["Full"]:
        return "red";
    }
  })();

  const fullText = (() => {
    switch (props.rvm?.status) {
      case RvmItemStatus["<=5%"]:
        return i18n.status5[language];
      case RvmItemStatus["<=20%"]:
        return i18n.status20[language];
      case RvmItemStatus["<=40%"]:
        return i18n.status40[language];
      case RvmItemStatus[">40%"]:
        return i18n.status60[language];
      case RvmItemStatus["Full"]:
        return i18n.statusFull[language];
    }
  })();

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Text>
              {props.rvm[`name_${rvmLanguage}`]}
              {i18n.rvm[language]}
            </Text>
            {props.rvm.status === RvmItemStatus["Full"] && (
              <Kbd backgroundColor="red">{i18n.statusFull[language]}</Kbd>
            )}
            {props.rvm.status === RvmItemStatus["<=5%"] && (
              <Kbd backgroundColor="red">{i18n.fullSoon[language]}</Kbd>
            )}
            {!props.rvm.deactivated && !props.rvm.under_maintenance ? (
              <Kbd>{i18n.operating[language]}</Kbd>
            ) : (
              <Kbd backgroundColor="red">{i18n.notInService[language]}</Kbd>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Card>
            <CardBody>
              <Image
                src={props.rvm.thumbnail}
                alt={props.rvm[`name_${rvmLanguage}`]}
              />
              <Stat>
                <StatLabel>{i18n.bottleCountInMachine[language]}</StatLabel>
                <StatNumber>{props.rvm.bin_count}</StatNumber>
                <StatHelpText>{fullText}</StatHelpText>
              </Stat>
              <CircularProgress
                value={fullPercentage}
                color={fullPercentageColor}
              >
                <CircularProgressLabel>{fullPercentage}%</CircularProgressLabel>
              </CircularProgress>
              {props.rvm.last_emptied_at && (
                <Text>
                  {i18n.lastEmptied[language]}{" "}
                  {new Date(props.rvm.last_emptied_at).toLocaleString()}
                </Text>
              )}
              {props.rvm.last_full && (
                <Text>
                  {i18n.lastFull[language]}{" "}
                  {new Date(props.rvm.last_full).toLocaleString()}
                </Text>
              )}
            </CardBody>
            <Divider />
            <CardFooter>
              <Stack>
                <Text>{props.rvm[`address_${rvmLanguage}`]}</Text>
                <Text>{props.rvm[`service_hour_${rvmLanguage}`]}</Text>
              </Stack>
            </CardFooter>
          </Card>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default Rvm;
