export enum Source {
  OpenStreetMap = "OpenStreetMap",
  LandsDTopographicMap = "LandsDTopographicMap",
  LandsDImageryMap = "LandsDImageryMap",
}

export enum SourceUrl {
  OpenStreetMap = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  LandsDTopographicMap = "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/WGS84/{z}/{x}/{y}.png",
  LandsDImageryMap = "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/imagery/WGS84/{z}/{x}/{y}.png",
}

export enum SourceAttribution {
  OpenStreetMap = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  LandsDTopographicMap = '<a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank" class="copyrightDiv">&copy; Map infortmation from Lands Department</a><div style="width:28px;height:28px;display:inline-flex;background:url(https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg);background-size:28px;"></div>',
  LandsDImageryMap = 'Image ©2002 NASA/USGS|Image ©2016 NASA/USGS|Contains modified Copernicus Sentinel data [2022]|<a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank" class="copyrightDiv">&copy;Map information from Lands Department</a><img style="height:28px;" src="https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg"></img>',
}

export interface MapProps {
  zoom: number;
  source: Source;
}
