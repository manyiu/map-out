export enum Source {
  OpenStreetMap = "OpenStreetMap",
  LandsDTopographicMap = "LandsDTopographicMap",
  LandsDImageryMap = "LandsDImageryMap",
}

export enum SourceUrl {
  OpenStreetMap = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  LandsDTopographicMap = "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/WGS84/{z}/{x}/{y}.png",
  LandsDImageryMap = "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/imagery/WGS84/{z}/{x}/{y}.png",
  LandsDMapLabel = "https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/label/hk/[language]/WGS84/{z}/{x}/{y}.png",
}

export enum SourceAttribution {
  OpenStreetMap = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  LandsDTopographicMap = `
    <div style="display: flex;">
      <a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank" class="copyrightDiv">© Map infortmation from Lands Department</a>
      <img crossorigin="anonymous" style="height:28px;" src="https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg" />
    </div>
  `,
  LandsDImageryMap = `
    <div style="display: flex;">
      <p>Image ©2002 NASA/USGS</p>
      <p>Image ©2016 NASA/USGS</p>
      <p>Contains modified Copernicus Sentinel data [2022]</p>
      <a href="https://api.portal.hkmapservice.gov.hk/disclaimer" target="_blank" class="copyrightDiv">©Map information from Lands Department</a>
      <img crossorigin="anonymous" style="height:28px;" src="https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg" />
    </div>
  `,
}
