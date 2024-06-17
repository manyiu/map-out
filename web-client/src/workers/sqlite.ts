import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import {
  RouteCitybus,
  RouteKmb,
  RouteStopCitybus,
  RouteStopKmb,
  StopCitybus,
  StopKmb,
} from "../hooks/types";

const sqlite3 = await sqlite3InitModule({});

const db = new sqlite3.oo1.OpfsDb("/map-out.sqlite3");

//#region Create StopKmb table
const createStopKmbSql = `
  CREATE TABLE IF NOT EXISTS StopKmb (
    lat REAL NOT NULL,
    long REAL NOT NULL,
    name_en TEXT NOT NULL,
    name_sc TEXT NOT NULL,
    name_tc TEXT NOT NULL,
    stop TEXT PRIMARY KEY NOT NULL
  )
`;
db.exec(createStopKmbSql);

const createStopKmbIndexSql = `
  CREATE INDEX IF NOT EXISTS StopKmb_lat_long
  ON StopKmb (lat, long)
`;
db.exec(createStopKmbIndexSql);
//#endregion Create StopKmb table

//#region Create StopCitybus table
const createStopCitybusSql = `
  CREATE TABLE IF NOT EXISTS StopCitybus (
    data_timestamp DATETIME NOT NULL,
    lat REAL NOT NULL,
    long REAL NOT NULL,
    name_en TEXT NOT NULL,
    name_sc TEXT NOT NULL,
    name_tc TEXT NOT NULL,
    stop TEXT PRIMARY KEY NOT NULL
  )
`;
db.exec(createStopCitybusSql);

const createStopCitybusIndexSql = `
  CREATE INDEX IF NOT EXISTS StopCitybus_lat_long
  ON StopCitybus (lat, long)
`;
db.exec(createStopCitybusIndexSql);
//#endregion Create StopCitybus table

//#region Create RouteKmb table
const createRouteKmbSql = `
  CREATE TABLE IF NOT EXISTS RouteKmb (
    bound CHAR(1) NOT NULL,
    dest_en TEXT NOT NULL,
    dest_sc TEXT NOT NULL,
    dest_tc TEXT NOT NULL,
    orig_en TEXT NOT NULL,
    orig_sc TEXT NOT NULL,
    orig_tc TEXT NOT NULL,
    route TEXT NOT NULL,
    service_type INTEGER NOT NULL,
    PRIMARY KEY (route, bound, service_type)
  )
`;
db.exec(createRouteKmbSql);
//#endregion Create RouteKmb table

//#region Create RouteCitybus table
const createRouteCitybusSql = `
  CREATE TABLE IF NOT EXISTS RouteCitybus (
    co TEXT NOT NULL,
    data_timestamp DATETIME NOT NULL,
    dest_en TEXT NOT NULL,
    dest_sc TEXT NOT NULL,
    dest_tc TEXT NOT NULL,
    orig_en TEXT NOT NULL,
    orig_sc TEXT NOT NULL,
    orig_tc TEXT NOT NULL,
    route TEXT PRIMARY KEY NOT NULL
  )
`;
db.exec(createRouteCitybusSql);
//#endregion Create RouteCitybus table

//#region Create RouteStopKmb table
const createRouteStopKmbSql = `
  CREATE TABLE IF NOT EXISTS RouteStopKmb (
    bound CHAR(1) NOT NULL,
    route TEXT NOT NULL,
    seq INTEGER NOT NULL,
    service_type INTEGER NOT NULL,
    stop TEXT NOT NULL,
    PRIMARY KEY (route, stop, service_type, seq)
  )
`;
db.exec(createRouteStopKmbSql);
//#endregion Create RouteStopKmb table

//#region Create RouteStopCitybus table
const createRouteStopCitybusSql = `
  CREATE TABLE IF NOT EXISTS RouteStopCitybus (
    co TEXT NOT NULL,
    data_timestamp TEXT NOT NULL,
    dir CHAR(1) NOT NULL,
    route TEXT NOT NULL,
    seq INTEGER NOT NULL,
    stop TEXT NOT NULL,
    PRIMARY KEY (route, stop, seq)
  )
`;
db.exec(createRouteStopCitybusSql);
//#endregion Create RouteStopCitybus table

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface MessageEventData<T = any> {
  type: string;
  data: T;
}

self.addEventListener(
  "message",
  async (event: MessageEvent<MessageEventData>) => {
    const dataType = event.data.type;

    if (dataType === "save::route-kmb") {
      const data = event.data.data as RouteKmb[];

      const sql = `
        INSERT OR REPLACE INTO RouteKmb (
          bound,
          dest_en,
          dest_sc,
          dest_tc,
          orig_en,
          orig_sc,
          orig_tc,
          route,
          service_type
        ) VALUES ${data
          .map(
            (route) =>
              `('${route.bound}', '${route.dest_en.replace(/'/g, "''")}', '${
                route.dest_sc
              }', '${route.dest_tc}', '${route.orig_en.replace(
                /'/g,
                "''"
              )}', '${route.orig_sc}', '${route.orig_tc}', '${route.route}', '${
                route.service_type
              }')`
          )
          .join(", ")}
      `;

      db.exec(sql);

      return;
    }

    if (dataType === "save::route-citybus") {
      const data = event.data.data as RouteCitybus[];

      const sql = `
        INSERT OR REPLACE INTO RouteCitybus (
          co,
          data_timestamp,
          dest_en,
          dest_sc,
          dest_tc,
          orig_en,
          orig_sc,
          orig_tc,
          route
        ) VALUES ${data
          .map(
            (route) =>
              `('${route.co}', ${
                new Date(route.data_timestamp).getTime() / 1000
              }, '${route.dest_en.replace(/'/g, "''")}', '${route.dest_sc}', '${
                route.dest_tc
              }', '${route.orig_en.replace(/'/g, "''")}', '${
                route.orig_sc
              }', '${route.orig_tc}', '${route.route}')`
          )
          .join(", ")}
      `;

      db.exec(sql);

      return;
    }

    if (dataType === "save::route-stop-kmb") {
      const data = event.data.data as RouteStopKmb[];

      const sql = `
        INSERT OR REPLACE INTO RouteStopKmb (
          bound,
          route,
          seq,
          service_type,
          stop
        ) VALUES ${data
          .map(
            (routeStop) =>
              `('${routeStop.bound}', '${routeStop.route}', ${parseInt(
                routeStop.seq
              )}, ${parseInt(routeStop.service_type)}, '${routeStop.stop}')`
          )
          .join(", ")}
      `;

      db.exec(sql);

      return;
    }

    if (dataType === "save::route-stop-citybus") {
      if (event.data.data.length === 0) {
        return;
      }

      const data = event.data.data as RouteStopCitybus[];

      const sql = `
        INSERT OR REPLACE INTO RouteStopCitybus (
          co,
          data_timestamp,
          dir,
          route,
          seq,
          stop
        ) VALUES ${data
          .map(
            (routeStop) =>
              `('${routeStop.co}', ${
                new Date(routeStop.data_timestamp).getTime() / 1000
              }, '${routeStop.dir}', '${routeStop.route}', ${routeStop.seq}, '${
                routeStop.stop
              }')`
          )
          .join(", ")}
      `;

      db.exec(sql);
    }

    if (dataType === "save::stop-kmb") {
      const data = event.data.data as StopKmb[];

      const sql = `
        INSERT OR REPLACE INTO StopKmb (
          lat,
          long,
          name_en,
          name_sc,
          name_tc,
          stop
        ) VALUES ${data
          .map(
            (stop) =>
              `(${parseFloat(stop.lat)}, ${parseFloat(
                stop.long
              )}, '${stop.name_en.replace(/'/g, "''")}', '${stop.name_sc}', '${
                stop.name_tc
              }', '${stop.stop}')`
          )
          .join(", ")}
      `;

      db.exec(sql);
    }

    if (dataType === "save::stop-citybus") {
      const data = event.data.data as StopCitybus;

      const sql = `
        INSERT OR REPLACE INTO StopCitybus (
          data_timestamp,
          lat,
          long,
          name_en,
          name_sc,
          name_tc,
          stop
        ) VALUES (${
          new Date(data.data_timestamp).getTime() / 1000
        }, ${parseFloat(data.lat)}, ${parseFloat(
        data.long
      )}, '${data.name_en.replace(/'/g, "''")}', '${data.name_sc}', '${
        data.name_tc
      }', '${data.stop}')
      `;

      try {
        db.exec(sql);
      } catch (error) {
        console.log(sql);
        console.error(error);
      }
    }

    if (dataType === "map-bounds") {
      const bounds = {
        lat: {
          lower: event.data.data._southWest.lat,
          upper: event.data.data._northEast.lat,
        },
        lng: {
          lower: event.data.data._southWest.lng,
          upper: event.data.data._northEast.lng,
        },
      };

      const stopKmbSql = `
        SELECT *
        FROM StopKmb
        WHERE lat BETWEEN ${bounds.lat.lower} AND ${bounds.lat.upper}
        AND long BETWEEN ${bounds.lng.lower} AND ${bounds.lng.upper}
      `;

      const stopsKmb = db.exec({
        sql: stopKmbSql,
        rowMode: "object",
        returnValue: "resultRows",
      });

      self.postMessage({
        type: "result::nearby-stop-kmb",
        data: stopsKmb,
      });

      const routeKmbSql = `
        SELECT *
        FROM RouteKmb
        JOIN RouteStopKmb ON RouteKmb.route = RouteStopKmb.route
        JOIN StopKmb ON RouteStopKmb.stop = StopKmb.stop
        WHERE StopKmb.lat BETWEEN ${bounds.lat.lower} AND ${bounds.lat.upper}
        AND StopKmb.long BETWEEN ${bounds.lng.lower} AND ${bounds.lng.upper}
      `;

      const routesKmb = db.exec({
        sql: routeKmbSql,
        rowMode: "object",
        returnValue: "resultRows",
      });

      self.postMessage({
        type: "result::nearby-route-kmb",
        data: routesKmb,
      });

      const stopCitybusSql = `
        SELECT *
        FROM StopCitybus
        WHERE lat BETWEEN ${bounds.lat.lower} AND ${bounds.lat.upper}
        AND long BETWEEN ${bounds.lng.lower} AND ${bounds.lng.upper}
      `;

      const stopsCitybus = db.exec({
        sql: stopCitybusSql,
        rowMode: "object",
        returnValue: "resultRows",
      });

      self.postMessage({
        type: "result::nearby-stop-citybus",
        data: stopsCitybus,
      });

      const routeCitybusSql = `
        SELECT *
        FROM RouteCitybus
        JOIN RouteStopCitybus ON RouteCitybus.route = RouteStopCitybus.route
        JOIN StopCitybus ON RouteStopCitybus.stop = StopCitybus.stop
        WHERE StopCitybus.lat BETWEEN ${bounds.lat.lower} AND ${bounds.lat.upper}
        AND StopCitybus.long BETWEEN ${bounds.lng.lower} AND ${bounds.lng.upper}
      `;

      const routesCitybus = db.exec({
        sql: routeCitybusSql,
        rowMode: "object",
        returnValue: "resultRows",
      });

      self.postMessage({
        type: "result::nearby-route-citybus",
        data: routesCitybus,
      });
    }
  }
);
