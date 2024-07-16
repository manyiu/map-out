import L from "leaflet";
import rawWebpIcon from "../../../assets/citybus.webp";

const citybusIcon = L.icon({
  iconUrl: rawWebpIcon,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

export default citybusIcon;
