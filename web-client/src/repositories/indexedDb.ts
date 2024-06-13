export const dbName = "map-out";

const request = indexedDB.open(dbName, 1);

request.onupgradeneeded = () => {
  const db = request.result;

  const stopsObjectStore = db.createObjectStore("stops", { keyPath: "stop" });
  stopsObjectStore.createIndex("lat", "lat", { unique: false });
  stopsObjectStore.createIndex("long", "long", { unique: false });
  stopsObjectStore.createIndex("geolocation", ["lat", "long"], {
    unique: false,
  });

  db.createObjectStore("routes-v1", {
    keyPath: ["route", "bound", "service_type"],
  });

  db.createObjectStore("routes-v2", { keyPath: "route" });

  db.createObjectStore("route-stops", { keyPath: "route" });
};
