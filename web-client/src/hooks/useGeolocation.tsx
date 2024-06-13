import { useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";

const useGeolocation = () => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
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
      (position) => setPosition(position),
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
        setPosition(position);
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
  }, [toast]);

  return { position, error };
};

export default useGeolocation;
