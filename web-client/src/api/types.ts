export interface DataWrapper<T = object> {
  data: T;
  generated_timestamp: string;
  type: string;
  version: string;
}

export interface RouteKmb {
  bound: string;
  dest_en: string;
  dest_sc: string;
  dest_tc: string;
  orig_en: string;
  orig_sc: string;
  orig_tc: string;
  route: string;
  service_type: string;
}

export interface RouteCitybus {
  co: string;
  data_timestamp: string;
  dest_en: string;
  dest_sc: string;
  dest_tc: string;
  orig_en: string;
  orig_sc: string;
  orig_tc: string;
  route: string;
}

export interface RouteStopKmb {
  bound: string;
  route: string;
  seq: string;
  service_type: string;
  stop: string;
}

export interface RouteStopCitybus {
  co: string;
  data_timestamp: string;
  dir: string;
  route: string;
  seq: number;
  stop: string;
}

export interface StopKmb {
  lat: string;
  long: string;
  name_en: string;
  name_sc: string;
  name_tc: string;
  stop: string;
}

export interface StopCitybus {
  data_timestamp: string;
  lat: string;
  long: string;
  name_en: string;
  name_sc: string;
  name_tc: string;
  stop: string;
}

export interface MapOutApiDataUpdateBody {
  timestamp: number;
  files: string[];
}

export interface KmbStopEta {
  co: string;
  route: string;
  dir: string;
  service_type: number;
  seq: number;
  dest_tc: string;
  dest_sc: string;
  dest_en: string;
  eta_seq: number;
  eta: string | null;
  rmk_tc: string;
  rmk_sc: string;
  rmk_en: string;
  data_timestamp: string;
}

export interface CitybusStopRouteEta {
  co: string;
  route: string;
  dir: string;
  seq: number;
  stop: string;
  dest_tc: string;
  dest_en: string;
  eta: string;
  rmk_tc: string;
  eta_seq: number;
  dest_sc: string;
  rmk_en: string;
  rmk_sc: string;
  data_timestamp: string;
}

interface GmbEta {
  eta_seq: number;
  diff: number;
  timestamp: string;
  remarks_tc: string | null;
  remarks_sc: string | null;
  remarks_en: string | null;
}

export interface GmbEtaStop {
  route_id: number;
  route_seq: number;
  stop_seq: number;
  enabled: boolean;
  eta: GmbEta[];
}
