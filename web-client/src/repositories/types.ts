import {
  RouteCitybus as ApiRouteCitybus,
  RouteKmb as ApiRouteKmb,
  StopCitybus as ApiStopCitybus,
  StopKmb as ApiStopKmb,
} from "../api/types";

export interface RouteKmb extends ApiRouteKmb {}

export interface RouteCitybus extends Omit<ApiRouteCitybus, "data_timestamp"> {
  data_timestamp: number;
}

export interface StopKmb extends Omit<ApiStopKmb, "lat" | "long"> {
  lat: number;
  long: number;
}

export interface StopCitybus
  extends Omit<ApiStopCitybus, "data_timestamp" | "lat" | "long"> {
  data_timestamp: number;
  lat: number;
  long: number;
}

export interface GmbRoute {
  route_id: number;
  region: "HKI" | "KLN" | "NT";
  route_code: string;
  description_tc: string;
  description_sc: string;
  description_en: string;
  route_seq: number;
  orig_tc: string;
  orig_sc: string;
  orig_en: string;
  dest_tc: string;
  dest_sc: string;
  dest_en: string;
  remarks_tc: string | null;
  remarks_sc: string | null;
  remarks_en: string | null;
}

export interface GmbStop {
  stop: number;
  lat: number;
  long: number;
  enabled: boolean;
  remarks_tc: string | null;
  remarks_sc: string | null;
  remarks_en: string | null;
}

export interface GmbRouteStop {
  route_id: number;
  route_seq: number;
  route_code: string;
  stop_seq: number;
  stop_id: number;
  name_tc: string;
  name_sc: string;
  name_en: string;
}
