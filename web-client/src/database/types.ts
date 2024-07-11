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
