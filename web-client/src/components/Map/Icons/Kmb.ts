import L from "leaflet";
import rawWebpIcon from "../../../assets/kmb.webp";

const kmbIcon = L.icon({
  iconUrl: rawWebpIcon,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default kmbIcon;
