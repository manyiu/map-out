import { Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Language, usePreferenceStore } from "../stores/preference";

interface CountdownProps {
  eta: string;
}

const i18n = {
  calculating: {
    en: "Calculating...",
    sc: "计算中...",
    tc: "計算中...",
  },
};

const formatTime = (time: number, language: Language) => {
  if (isNaN(time)) {
    return i18n.calculating[language];
  }

  if (time <= 0) {
    return "-";
  }

  const hours = Math.floor(time / 3600000);
  const minutes = Math.floor((time % 3600000) / 60000);
  const seconds = Math.floor((time % 60000) / 1000);

  return `${hours ? hours + ":" : ""}${
    minutes >= 10 ? minutes : "0" + minutes
  }:${seconds >= 10 ? seconds : "0" + seconds}`;
};

const Countdown = (props: CountdownProps) => {
  const [countdown, setCountdown] = useState(NaN);
  const language = usePreferenceStore((state) => state.language);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const diff = new Date(props.eta).getTime() - new Date().getTime();

      setCountdown(diff);
    }, 0);

    const intervalId = setInterval(() => {
      const diff = new Date(props.eta).getTime() - new Date().getTime();

      if (diff <= 0) {
        clearInterval(intervalId);
      }

      clearTimeout(timeoutId);
      setCountdown(diff);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [props.eta]);

  return <Text>{formatTime(countdown, language)}</Text>;
};

export default Countdown;
