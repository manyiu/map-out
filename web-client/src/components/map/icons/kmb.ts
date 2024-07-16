import L from "leaflet";
import rawWebpIcon from "../../../assets/kmb.webp";

const kmbIcon = L.icon({
  iconUrl: rawWebpIcon,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

export default kmbIcon;
