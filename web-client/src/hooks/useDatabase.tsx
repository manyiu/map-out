import { useToast } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { usePreferenceStore } from "../stores/preference";
import { dbWorker, fetchWorker } from "../workers";

const i18n = {
  databaseResetTitle: {
    en: "Database Seccessfully Reset",
    sc: "数据库已成功重置",
    tc: "數據庫已成功重置",
  },
  databaseResetDescription: {
    en: "Data will be refetched in the background",
    sc: "数据将在后台重新获取",
    tc: "數據將在後台重新獲取",
  },
};

const useDatabase = () => {
  const [up, setUp] = useState(false);
  const [ready, setReady] = useState(false);
  const language = usePreferenceStore((state) => state.language);
  const toast = useToast();
  const toastMemo = useMemo(() => toast, [toast]);

  useEffect(() => {
    const pingIntervalId = setInterval(() => {
      dbWorker.postMessage({
        type: "ping",
      });
    }, 1000);

    let checkEmptyIntervalId: NodeJS.Timeout;

    const fetchEventListener = (event: MessageEvent) => {
      switch (event.data.type) {
        case "database::save::citybus::route":
        case "database::save::citybus::stop":
        case "database::save::citybus::route-stop":
        case "database::save::kmb::route":
        case "database::save::kmb::stop":
        case "database::save::kmb::route-stop":
        case "database::save::gmb::route":
        case "database::save::gmb::stop":
        case "database::save::gmb::route-stop":
          dbWorker.postMessage(event.data);
          break;
      }
    };

    const dbEventListener = (event: MessageEvent) => {
      if (event.data.type === "pong") {
        clearInterval(pingIntervalId);
        checkEmptyIntervalId = setInterval(() => {
          dbWorker.postMessage({ type: "database::check-empty" });
        }, 3000);
        dbWorker.postMessage({ type: "database::check-empty" });
        setUp(true);
      }

      if (event.data.type === "result::database::check-empty") {
        if (event.data.data) {
          fetchWorker.postMessage({ type: "fetch::update" });
          clearInterval(checkEmptyIntervalId);
        } else {
          setReady(true);
        }
      }

      if (event.data.type === "done::database::reset") {
        fetchWorker.postMessage({
          type: "fetch::update",
        });

        toastMemo({
          title: i18n.databaseResetTitle[language],
          description: i18n.databaseResetDescription[language],
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchWorker.addEventListener("message", fetchEventListener);
    dbWorker.addEventListener("message", dbEventListener);

    return () => {
      clearInterval(pingIntervalId);
      clearInterval(checkEmptyIntervalId);
      fetchWorker.removeEventListener("message", fetchEventListener);
      dbWorker.removeEventListener("message", dbEventListener);
    };
  }, [language, toastMemo]);

  return { up, ready, setReady };
};

export default useDatabase;
