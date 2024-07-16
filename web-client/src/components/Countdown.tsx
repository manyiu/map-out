import { Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface CountdownProps {
  eta: string;
}

const formatTime = (time: number) => {
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
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const diff = new Date(props.eta).getTime() - new Date().getTime();

      setCountdown(diff);

      if (diff <= 0) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [props.eta]);

  return <Text>{formatTime(countdown)}</Text>;
};

export default Countdown;
