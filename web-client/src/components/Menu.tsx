import { ChevronLeftIcon, SettingsIcon } from "@chakra-ui/icons";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Center,
  Divider,
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
import { dbWorker } from "../workers";

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
    tc: "更新間隔（秒）",
  },
  refetchIntervalHelperText: {
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
  advancedSettings: {
    en: "Advanced Settings",
    sc: "高级设置",
    tc: "高級設置",
  },
  advancedSettingsHelperText: {
    en: "These settings are for advanced users only. Changing them may cause the app work improperly.",
    sc: "这些设置仅供高级用户使用。更改这些设置可能会导致应用程序无法正常工作。",
    tc: "這些設置僅供高級用戶使用。更改這些設置可能會導致應用程序無法正常工作。",
  },
  minDisplayZoomLevel: {
    en: "Minimum Zoom Level to Display Information",
    sc: "显示信息的最小缩放级别",
    tc: "顯示信息的最小縮放級別",
  },
  minDisplayZoomLevelHelperText: {
    en: "Set the minimum zoom level to display information. If the current zoom level is lower than this value, the information will not be displayed.",
    sc: "设置显示信息的最小缩放级别。如果当前缩放级别低于此值，则不会显示信息。",
    tc: "設置顯示信息的最小縮放級別。如果當前縮放級別低於此值，則不會顯示信息。",
  },
  databaseReset: {
    en: "Reset Database",
    sc: "重置数据库",
    tc: "重置數據庫",
  },
  databaseResetHelperText: {
    en: "If your app is not working properly, or the data is looking weird, you can try to reset the database and refetch the data.",
    sc: "如果您的应用程序无法正常工作，或数据看起来很奇怪，您可以尝试重置数据库并重新获取数据。",
    tc: "如果您的應用程序無法正常工作，或數據看起來很奇怪，您可以嘗試重置數據庫並重新獲取數據。",
  },
};

const Menu = () => {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const language = usePreferenceStore((state) => state.language);
  const source = usePreferenceStore((state) => state.source);
  const refetchInterval = usePreferenceStore((state) => state.refetchInterval);
  const minDisplayZoom = usePreferenceStore((state) => state.minDisplayZoom);
  const setLanguage = usePreferenceStore((state) => state.setLanguage);
  const setSource = usePreferenceStore((state) => state.setSource);
  const setRefetchInterval = usePreferenceStore(
    (state) => state.setRefetchInterval
  );
  const setMinDisplayZoom = usePreferenceStore(
    (state) => state.setMinDisplayZoom
  );
  const { colorMode, toggleColorMode } = useColorMode();

  const resetHandler = () => {
    dbWorker.postMessage({
      type: "database::reset",
    });
  };

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
        <Card height="100dvh" overflowY="scroll">
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
                    {i18n.refetchIntervalHelperText[language]}
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
            <Accordion allowToggle mt={4}>
              <AccordionItem>
                <AccordionButton>
                  <Stack>
                    <Text>{i18n.advancedSettings[language]}</Text>
                    <Text fontSize="sm">
                      {i18n.advancedSettingsHelperText[language]}
                    </Text>
                  </Stack>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                  <Divider mb={4} />
                  <Stack divider={<StackDivider />} spacing={4}>
                    <FormControl>
                      <FormLabel>
                        {i18n.minDisplayZoomLevel[language]}
                      </FormLabel>
                      <NumberInput
                        defaultValue={minDisplayZoom}
                        max={18}
                        onChange={(value) => setMinDisplayZoom(parseInt(value))}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <FormHelperText>
                        {i18n.minDisplayZoomLevelHelperText[language]}
                      </FormHelperText>
                    </FormControl>
                    <FormControl>
                      <Center>
                        <Button onClick={resetHandler} colorScheme="red">
                          {i18n.databaseReset[language]}
                        </Button>
                      </Center>
                      <FormHelperText>
                        {i18n.databaseResetHelperText[language]}
                      </FormHelperText>
                    </FormControl>
                  </Stack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
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
              <SettingsIcon boxSize={5} />
            )}
          </Button>
        </Card>
      </Slide>
    </>
  );
};

export default Menu;
