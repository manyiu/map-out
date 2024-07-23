import { Alert, AlertIcon, AlertTitle } from "@chakra-ui/react";
import { useMapStore } from "../../stores/map";
import { usePreferenceStore } from "../../stores/preference";

const i18n = {
  title: {
    en: "To prevent information overload, some information will only be displayed when zoomed in.",
    sc: "为了防止信息过载，某些信息只会在放大时显示。",
    tc: "為了防止信息過載，某些信息只會在放大時顯示。",
  },
};

const ZoomAlert = () => {
  const language = usePreferenceStore((state) => state.language);
  const zoom = useMapStore((state) => state.zoom);
  const minDisplayZoom = usePreferenceStore((state) => state.minDisplayZoom);

  if (zoom < minDisplayZoom) {
    return (
      <Alert
        status="warning"
        variant="solid"
        style={{
          width: "fit-content",
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 401,
        }}
      >
        <AlertIcon />
        <AlertTitle>{i18n.title[language]}</AlertTitle>
      </Alert>
    );
  }

  return null;
};

export default ZoomAlert;
