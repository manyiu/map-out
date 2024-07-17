import L from "leaflet";
import rawWebpIcon from "../../../assets/gmb.webp";

const gmbIcon = L.icon({
  iconUrl: rawWebpIcon,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default gmbIcon;
