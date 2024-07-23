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

export enum RvmItemStatus {
  "<=5%" = "<=5%",
  "<=20%" = "<=20%",
  "<=40%" = "<=40%",
  ">40%" = ">40%",
  "Full" = "Full",
}

export interface RvmItem {
  id: string;
  rvm_id: string;
  serial_no: string;
  location_type: string;
  name: string;
  name_en: string;
  name_zht: string;
  name_zhs: string;
  area: string;
  district: string;
  address: string;
  address_en: string;
  address_zht: string;
  address_zhs: string;
  service_hour: string;
  service_hour_en: string;
  service_hour_zht: string;
  service_hour_zhs: string;
  coordinates: [number, number];
  thumbnail: string;
  phase: string;
  picture: {
    id: string;
    deleted: null;
    deleted_by_cascade: boolean;
    created_at: string;
    updated_at: string;
    filename: string;
    size: number;
    content_type: string;
    file: string;
    account: string;
  };
  status: RvmItemStatus;
  bin_count: number;
  bin_count_full_threshold: number;
  under_maintenance: boolean;
  service_status: number;
  last_emptied_at: string;
  last_online: string;
  last_full: string | null;
  create_task_threshold: string;
  create_task_valid_until: number;
  sub_contractor: {
    code: "SL";
    deleted: null;
    deleted_by_cascade: boolean;
    created_at: string;
    updated_at: string;
    name: string;
    districts: string[];
  };
  sub_contractor_id: string;
  deactivated: boolean;
}

export interface RvmResponse {
  success: boolean;
  rvms: RvmItem[];
}
