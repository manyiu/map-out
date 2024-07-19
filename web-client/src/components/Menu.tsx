import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Radio,
  RadioGroup,
  Slide,
  Stack,
  StackDivider,
  Switch,
  Text,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react";
import { usePreferenceStore } from "../stores/preference";

const i18n = {
  colorMode: {
    en: "Color Mode",
    sc: "颜色模式",
    tc: "色調亮度",
  },
  light: {
    en: "Light",
    sc: "明亮",
    tc: "淺色",
  },
  dark: {
    en: "Dark",
    sc: "黑暗",
    tc: "深色",
  },
  language: {
    en: "Language",
    sc: "语言",
    tc: "語言",
  },
  refetchInterval: {
    en: "Refetch Interval (in second)",
    sc: "刷新间隔（秒）",
    tc: "刷新間隔（秒）",
  },
  refetchIntervalHelper: {
    en: "Setting the value too low may cause your device to be banned from the server",
    sc: "设置值过低可能导致您的设备被服务器封禁",
    tc: "設置值過低可能導致您的設備被服務器封禁",
  },
  mapSource: {
    en: "Map Source",
    sc: "地图来源",
    tc: "地圖來源",
  },
  openStreetMap: {
    en: "OpenStreetMap",
    sc: "OpenStreetMap",
    tc: "OpenStreetMap",
  },
  landsDTopographicMap: {
    en: "Lands Department Topographic Map",
    sc: "地政总署地形图",
    tc: "地政總署地形圖",
  },
  landsDImageryMap: {
    en: "Lands Department Imagery Map",
    sc: "地政总署影像地图",
    tc: "地政總署影像地圖",
  },
};

const Menu = () => {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const language = usePreferenceStore((state) => state.language);
  const source = usePreferenceStore((state) => state.source);
  const refetchInterval = usePreferenceStore((state) => state.refetchInterval);
  const setLanguage = usePreferenceStore((state) => state.setLanguage);
  const setSource = usePreferenceStore((state) => state.setSource);
  const setRefetchInterval = usePreferenceStore(
    (state) => state.setRefetchInterval
  );
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <>
      <Slide
        direction="left"
        in={isOpen}
        style={{
          zIndex: 1001,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          cursor: "pointer",
        }}
        onClick={onClose}
      />
      <Slide
        direction="left"
        in={isOpen}
        style={{
          zIndex: 1002,
          width: "50dvw",
          maxWidth: "400px",
          minWidth: "300px",
        }}
      >
        <Card height="100dvh">
          <CardHeader>
            <Text fontSize="2xl">Map Out</Text>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing={4}>
              <Box>
                <FormLabel>{i18n.colorMode[language]}</FormLabel>
                <HStack spacing={3}>
                  <FormLabel mb={0}>{i18n.dark[language]}</FormLabel>
                  <Switch
                    id="colorMode"
                    isChecked={colorMode === "light"}
                    onChange={toggleColorMode}
                  />
                  <FormLabel mb={0}>{i18n.light[language]}</FormLabel>
                </HStack>
              </Box>
              <Box>
                <FormLabel>{i18n.language[language]}</FormLabel>
                <RadioGroup onChange={setLanguage} value={language}>
                  <Stack direction="row">
                    <Radio value="en">English</Radio>
                    <Radio value="tc">正體中文</Radio>
                    <Radio value="sc">简体中文</Radio>
                  </Stack>
                </RadioGroup>
              </Box>
              <Box>
                <FormControl>
                  <FormLabel>{i18n.refetchInterval[language]}</FormLabel>
                  <NumberInput
                    value={refetchInterval / 1000}
                    min={10}
                    max={60}
                    onChange={(valueString) =>
                      setRefetchInterval(parseInt(valueString) * 1000)
                    }
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>
                    {i18n.refetchIntervalHelper[language]}
                  </FormHelperText>
                </FormControl>
              </Box>
              <Box>
                <FormLabel>{i18n.mapSource[language]}</FormLabel>
                <RadioGroup onChange={setSource} value={source}>
                  <Stack>
                    <Radio value="OpenStreetMap">
                      {i18n.openStreetMap[language]}
                    </Radio>
                    <Radio value="LandsDTopographicMap">
                      {i18n.landsDTopographicMap[language]}
                    </Radio>
                    <Radio value="LandsDImageryMap">
                      {i18n.landsDImageryMap[language]}
                    </Radio>
                  </Stack>
                </RadioGroup>
              </Box>
            </Stack>
          </CardBody>
          <CardFooter>
            <Text>© 2024 Vazue</Text>
          </CardFooter>
        </Card>
        <Card
          style={{
            position: "absolute",
            right: -65,
            bottom: 10,
          }}
        >
          <Button onClick={onToggle} colorScheme="gray">
            {isOpen ? (
              <ChevronLeftIcon boxSize={5} />
            ) : (
              <ChevronRightIcon boxSize={5} />
            )}
          </Button>
        </Card>
      </Slide>
    </>
  );
};

export default Menu;
