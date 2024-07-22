enum RvmItemStatus {
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
  coordinates: [string, string];
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
}
