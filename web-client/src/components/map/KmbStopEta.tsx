import { Modal, ModalContent, ModalOverlay } from "@chakra-ui/react";
import useKmbStopEta from "../../hooks/useKmbStopEta";
import { StopKmb } from "../../repositories/types";

interface KmbStopEtaProps {
  stop: StopKmb | null;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const KmtStopEta = (props: KmbStopEtaProps) => {
  const { data, isLoading, isError } = useKmbStopEta(props.stop?.stop || null);

  if (isLoading || !data) {
    return <div>Loading...</div>;
  }

  if (data.length === 0) {
    return <div>No data</div>;
  }

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <div>
          {isError ? (
            <div>
              Failed to fetch /v1/transport/kmb/stop-eta/{props.stop?.stop}
            </div>
          ) : (
            <div>
              {data.map((eta) => (
                <div
                  key={`${eta.co}-${eta.route}-${eta.service_type}-${eta.dir}-${eta.eta_seq}`}
                >
                  <div>{eta.route}</div>
                  <div>{eta.eta}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
};

export default KmtStopEta;
