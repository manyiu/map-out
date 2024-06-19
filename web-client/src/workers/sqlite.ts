import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import {
  RouteCitybus,
  RouteDirectionGmb,
  RouteDirectionHeadwayGmb,
  RouteGmb,
  RouteKmb,
  RouteStopCitybus,
  RouteStopKmb,
  RouteStopListGmb,
  StopCitybus,
  StopGmb,
  StopKmb,
} from "../hooks/types";

const sqlite3 = await sqlite3InitModule({});

const db = new sqlite3.oo1.OpfsDb("/map-out.sqlite3");

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

//#region Create GMB Route related tables
const createRouteGmbSql = `
  CREATE TABLE IF NOT EXISTS RouteGmb (
    route_id INTEGER PRIMARY KEY NOT NULL,
    region TEXT NOT NULL,
    route_code TEXT NOT NULL,
    description_tc TEXT NOT NULL,
    description_sc TEXT NOT NULL,
    description_en TEXT NOT NULL,
    data_timestamp DATETIME NOT NULL
  )
`;

db.exec(createRouteGmbSql);

const createRouteDirectionGmbSql = `
  CREATE TABLE IF NOT EXISTS RouteDirectionGmb (
    route_id INTEGER NOT NULL,
    route_seq INTEGER NOT NULL,
    orig_tc TEXT NOT NULL,
    orig_sc TEXT NOT NULL,
    orig_en TEXT NOT NULL,
    dest_tc TEXT NOT NULL,
    dest_sc TEXT NOT NULL,
    dest_en TEXT NOT NULL,
    remarks_tc TEXT,
    remarks_sc TEXT,
    remarks_en TEXT,
    data_timestamp DATETIME NOT NULL,
    PRIMARY KEY (route_id, route_seq)
  )
`;

db.exec(createRouteDirectionGmbSql);

const createRouteHeadwayGmbSql = `
  CREATE TABLE IF NOT EXISTS RouteHeadwayGmb (
    route_id INTEGER NOT NULL,
    route_seq INTEGER NOT NULL,
    headway_seq INTEGER NOT NULL,
    weekday_1 BOOLEAN NOT NULL,
    weekday_2 BOOLEAN NOT NULL,
    weekday_3 BOOLEAN NOT NULL,
    weekday_4 BOOLEAN NOT NULL,
    weekday_5 BOOLEAN NOT NULL,
    weekday_6 BOOLEAN NOT NULL,
    weekday_7 BOOLEAN NOT NULL,
    public_holiday BOOLEAN NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    frequency INTEGER,
    frequency_upper INTEGER,
    PRIMARY KEY (route_id, route_seq, headway_seq)
  )
`;

db.exec(createRouteHeadwayGmbSql);
//#endregion Create GMB Route related tables

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

//#region Create RouteStopGmb table
const createRouteStopGmbSql = `
  CREATE TABLE IF NOT EXISTS RouteStopGmb (
    route_id INTEGER NOT NULL,
    route_seq INTEGER NOT NULL,
    stop_seq INTEGER NOT NULL,
    name_tc TEXT NOT NULL,
    name_sc TEXT NOT NULL,
    name_en TEXT NOT NULL,
    PRIMARY KEY (route_id, route_seq, stop_seq)
  )
`;

db.exec(createRouteStopGmbSql);
//#endregion Create RouteStopGmb table

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

//#region Create GMB Stop table
const createStopGmbSql = `
  CREATE TABLE IF NOT EXISTS StopGmb (
    id INTEGER PRIMARY KEY NOT NULL,
    coordinates_wgs84_latitude REAL NOT NULL,
    coordinates_wgs84_longitude REAL NOT NULL,
    coordinates_hk80_latitude REAL NOT NULL,
    coordinates_hk80_longitude REAL NOT NULL,
    enabled BOOLEAN NOT NULL,
    remarks_tc TEXT,
    remarks_sc TEXT,
    remarks_en TEXT,
    data_timestamp DATETIME NOT NULL
  )
`;

db.exec(createStopGmbSql);

const createStopGmbIndexSql = `
  CREATE INDEX IF NOT EXISTS StopGmb_coordinates_wgs84
  ON StopGmb (coordinates_wgs84_latitude, coordinates_wgs84_longitude)
`;

db.exec(createStopGmbIndexSql);
//#endregion Create GMB Stop table

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface MessageEventData<T = any, U = any> {
  type: string;
  params?: U;
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

    if (dataType === "save::route-gmb") {
      const data = event.data.data as RouteGmb[];

      const routeSql = `
        INSERT OR REPLACE INTO RouteGmb (
          route_id,
          region,
          route_code,
          description_tc,
          description_sc,
          description_en,
          data_timestamp
        ) VALUES ${data
          .map(
            (route) =>
              `(${route.route_id}, '${route.region}', '${route.route_code}', '${
                route.description_tc
              }', '${route.description_sc}', '${route.description_en.replace(
                /'/g,
                "''"
              )}', ${new Date(route.data_timestamp).getTime() / 1000})`
          )
          .join(",")}
      `;

      db.exec(routeSql);

      const directions: (RouteDirectionGmb & { route_id: number })[] = [];

      for (const route of data) {
        for (const direction of route.directions) {
          directions.push({
            ...direction,
            route_id: route.route_id,
          });
        }
      }

      const directionSql = `
        INSERT OR REPLACE INTO RouteDirectionGmb (
          route_id,
          route_seq,
          orig_tc,
          orig_sc,
          orig_en,
          dest_tc,
          dest_sc,
          dest_en,
          remarks_tc,
          remarks_sc,
          remarks_en,
          data_timestamp
        ) VALUES ${directions
          .map(
            (direction) =>
              `(${direction.route_id}, ${direction.route_seq}, '${
                direction.orig_tc
              }', '${direction.orig_sc}', '${direction.orig_en.replace(
                /'/g,
                "''"
              )}', '${direction.dest_tc}', '${
                direction.dest_sc
              }', '${direction.dest_en.replace(/'/g, "''")}', ${
                direction.remarks_tc ? `'${direction.remarks_tc}'` : "NULL"
              }, ${
                direction.remarks_sc ? `'${direction.remarks_sc}'` : "NULL"
              }, ${
                direction.remarks_en ? `'${direction.remarks_en}'` : "NULL"
              }, ${new Date(direction.data_timestamp).getTime() / 1000})`
          )
          .join(", ")}
      `;

      db.exec(directionSql);

      const headways: (RouteDirectionHeadwayGmb & {
        route_id: number;
        route_seq: number;
      })[] = [];

      for (const route of data) {
        for (const direction of route.directions) {
          for (const headway of direction.headways) {
            headways.push({
              ...headway,
              route_id: route.route_id,
              route_seq: direction.route_seq,
            });
          }
        }
      }

      if (headways.length === 0) {
        return;
      }

      const headwaySql = `
        INSERT OR REPLACE INTO RouteHeadwayGmb (
          route_id,
          route_seq,
          headway_seq,
          weekday_1,
          weekday_2,
          weekday_3,
          weekday_4,
          weekday_5,
          weekday_6,
          weekday_7,
          public_holiday,
          start_time,
          end_time,
          frequency,
          frequency_upper
        ) VALUES ${headways
          .map(
            (headway) =>
              `(${headway.route_id}, ${headway.route_seq}, ${
                headway.headway_seq
              }, ${headway.weekdays[0]}, ${headway.weekdays[1]}, ${
                headway.weekdays[2]
              }, ${headway.weekdays[3]}, ${headway.weekdays[4]}, ${
                headway.weekdays[5]
              }, ${headway.weekdays[6]}, ${headway.public_holiday}, '${
                headway.start_time
              }', ${headway.end_time ? `'${headway.end_time}'` : "NULL"}, ${
                headway.frequency ?? "NULL"
              }, ${headway.frequency_upper ?? "NULL"})`
          )
          .join(", ")}
      `;

      db.exec(headwaySql);

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

      return;
    }

    if (dataType === "save::route-stop-gmb") {
      const params = event.data.params as { routeId: number; routeSeq: number };
      const data = event.data.data as RouteStopListGmb;

      const sql = `
        INSERT OR REPLACE INTO RouteStopGmb (
          route_id,
          route_seq,
          stop_seq,
          name_tc,
          name_sc,
          name_en
        ) VALUES ${data.route_stops
          .map(
            (routeStop) =>
              `(${params.routeId}, ${params.routeSeq}, ${
                routeStop.stop_seq
              }, '${routeStop.name_tc}', '${
                routeStop.name_sc
              }', '${routeStop.name_en.replace(/'/g, "''")}')`
          )
          .join(", ")}
      `;

      db.exec(sql);

      return;
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

      return;
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

      db.exec(sql);

      return;
    }

    if (dataType === "save::stop-gmb") {
      const data = event.data.data as StopGmb & { id: string };

      const sql = `
        INSERT OR REPLACE INTO StopGmb (
          id,
          coordinates_wgs84_latitude,
          coordinates_wgs84_longitude,
          coordinates_hk80_latitude,
          coordinates_hk80_longitude,
          enabled,
          remarks_tc,
          remarks_sc,
          remarks_en,
          data_timestamp
        ) VALUES (${parseInt(data.id)}, ${data.coordinates.wgs84.latitude}, ${
        data.coordinates.wgs84.longitude
      }, ${data.coordinates.hk80.latitude}, ${
        data.coordinates.hk80.longitude
      }, ${data.enabled}, ${
        data.remarks_tc ? `'${data.remarks_tc}'` : "NULL"
      }, ${data.remarks_sc ? `'${data.remarks_sc}'` : "NULL"}, ${
        data.remarks_en ? `'${data.remarks_en}'` : "NULL"
      }, ${new Date(data.data_timestamp).getTime() / 1000})
      `;

      db.exec(sql);

      return;
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

      return;
    }
  }
);
