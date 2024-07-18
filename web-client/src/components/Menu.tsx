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
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { usePreferenceStore } from "../stores/preference";

const i18n = {
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
};

const Menu = () => {
  const { isOpen, onToggle } = useDisclosure();
  const language = usePreferenceStore((state) => state.language);
  const refetchInterval = usePreferenceStore((state) => state.refetchInterval);
  const setLanguage = usePreferenceStore((state) => state.setLanguage);
  const setRefetchInterval = usePreferenceStore(
    (state) => state.setRefetchInterval
  );

  return (
    <>
      <Slide
        direction="left"
        in={isOpen}
        style={{
          zIndex: 1001,
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
                <FormLabel>{i18n.language[language]}</FormLabel>
                <RadioGroup onChange={setLanguage} value={language}>
                  <Stack direction="row">
                    <Radio value="en">English</Radio>
                    <Radio value="tc">繁體中文</Radio>
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
