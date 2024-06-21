import { useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useGeolocationStore } from "../stores/geolocation";

const useGeolocation = () => {
  const geolocation = useGeolocationStore((state) => state.geolocation);
  const setGeolocation = useGeolocationStore((state) => state.setGeolocation);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const geo = navigator.geolocation;
    if (!geo) {
      toast({
        title: "Geolocation Error",
        description: "An error occurred while trying to get your location.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      setError("Geolocation is not supported");
      return;
    }

    geo.getCurrentPosition(
      (position) => setGeolocation(position),
      (error) => {
        toast({
          title: "Geolocation Error",
          description: "An error occurred while trying to get your location.",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
        setError(error.message);
      }
    );

    const watcher = geo.watchPosition(
      (position) => {
        setGeolocation(position);
      },
      (error) => {
        toast({
          title: "Geolocation Error",
          description: "An error occurred while trying to get your location.",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
        setError(error.message);
      }
    );

    return () => geo.clearWatch(watcher);
  }, [setGeolocation, toast]);

  return { geolocation, error };
};

export default useGeolocation;
