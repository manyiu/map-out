import L from "leaflet";
import rawWebpIcon from "../../../assets/citybus.webp";

const citybusIcon = L.icon({
  iconUrl: rawWebpIcon,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default citybusIcon;
