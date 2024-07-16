export interface DataWrapper<T = object> {
  data: T;
  generated_timestamp: string;
  type: string;
  version: string;
}

export interface RouteListGmb {
  routes: {
    HKI: string[];
    KLN: string[];
    NT: string[];
  };
}

export interface LastUpdateRouteGmb {
  route_id: number;
  last_update_date: string;
}

export interface LastUpdateStopGmb {
  stop_id: number;
  last_update_date: string;
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

export interface RouteDirectionHeadwayGmb {
  weekdays: [boolean, boolean, boolean, boolean, boolean, boolean, boolean];
  public_holiday: boolean;
  headway_seq: number;
  start_time: string;
  end_time: string | null;
  frequency: number | null;
  frequency_upper: number | null;
}

export interface RouteDirectionGmb {
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
  headways: RouteDirectionHeadwayGmb[];
  data_timestamp: string;
}

export interface RouteGmb {
  route_id: number;
  region: string;
  route_code: string;
  description_tc: string;
  description_sc: string;
  description_en: string;
  directions: RouteDirectionGmb[];
  data_timestamp: string;
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

export interface RouteStopGmb {
  stop_seq: number;
  stop_id: number;
  name_tc: string;
  name_sc: string;
  name_en: string;
}

export interface RouteStopListGmb {
  route_stops: RouteStopGmb[];
}

export interface StopRouteGmb {
  route_id: number;
  route_seq: number;
  stop_seq: number;
  name_tc: string;
  name_sc: string;
  name_en: string;
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

export interface StopGmb {
  coordinates: {
    wgs84: {
      latitude: number;
      longitude: number;
    };
    hk80: {
      latitude: number;
      longitude: number;
    };
  };
  enabled: boolean;
  remarks_tc: string | null;
  remarks_sc: string | null;
  remarks_en: string | null;
  data_timestamp: string;
}

export interface EtaGmb {
  eta_seq: number;
  diff: number;
  timestamp: string;
  remarks_tc: string | null;
  remarks_sc: string | null;
  remarks_en: string | null;
}

export interface EtaRouteStopGmb {
  route_id: number;
  route_seq: number;
  stop_id: number;
  enabled: boolean;
  eta: EtaGmb[];
}

export interface CsdiDataQueryWrapper<T = object> {
  features: T[];
  numberMatched: number;
  numberReturned: number;
  timeStamp: string;
  type: string;
}

export interface TerminusLocationCoordinateGmb {
  geometry: {
    coordinates: [number, number];
    type: string;
  };
  properties: {
    LAST_UPDATE_DATE: string;
    OBJECTID: number;
    STOP_ID: number;
  };
}

interface DataGroupedByStopRouteEta {
  etaSeq: number;
  diff: number;
  timestamp: string;
  remarks: {
    tc: string | null;
    sc: string | null;
    en: string | null;
  };
}

export interface DataGroupedByStopRoute {
  routeId: number;
  routeCode: string;
  routeSeq: number;
  stopSeq: number;
  stopName: {
    tc: string;
    sc: string;
    en: string;
  };
  description: {
    tc: string;
    sc: string;
    en: string;
  };
  direction: {
    orig: {
      tc: string;
      sc: string;
      en: string;
    };
    dest: {
      tc: string;
      sc: string;
      en: string;
    };
    remarks: {
      tc: string | null;
      sc: string | null;
      en: string | null;
    };
  };
  eta: DataGroupedByStopRouteEta[];
}

export interface DataGroupedByStop {
  stopId: number;
  lat: number;
  long: number;
  routes: DataGroupedByStopRoute[];
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
