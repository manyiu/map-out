export interface DataWrapper<T = object> {
  data: T;
  generated_timestamp: string;
  type: string;
  version: string;
}

export interface RouteV1 {
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

export interface RouteV2 {
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

export interface RouteStopV1 {
  route: string;
  bound: string;
  service_type: string;
  seq: string;
  stop: string;
}

export interface RouteStopV2 {
  co: string;
  data_timestamp: string;
  dir: string;
  route: string;
  seq: number;
  stop: string;
}

export interface Stop {
  data_timestamp: string;
  lat: string;
  long: string;
  name_en: string;
  name_sc: string;
  name_tc: string;
  stop: string;
}
