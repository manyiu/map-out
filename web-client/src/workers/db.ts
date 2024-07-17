import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import {
  RouteCitybus,
  RouteKmb,
  RouteStopCitybus,
  RouteStopKmb,
  StopCitybus,
  StopKmb,
} from "../api/types";
import { GmbRoute, GmbRouteStop, GmbStop } from "../repositories/types";
import { MessageEventData } from "./types";

const main = async () => {
  const sqlite3 = await sqlite3InitModule({});

  const db = new sqlite3.oo1.OpfsDb("/map-out.sqlite3");

  // db.exec("DROP TABLE IF EXISTS RouteGmb");
  // db.exec("DROP TABLE IF EXISTS RouteHeadwayGmb");
  // db.exec("DROP TABLE IF EXISTS RouteStopGmb");
  // db.exec("DROP TABLE IF EXISTS StopGmb");

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

  //#region Create GMB Route related tables
  const createRouteGmbSql = `
  CREATE TABLE IF NOT EXISTS RouteGmb (
    route_id INTEGER NOT NULL,
    route_seq INTEGER NOT NULL,
    region TEXT NOT NULL,
    route_code TEXT NOT NULL,
    orig_tc TEXT NOT NULL,
    orig_sc TEXT NOT NULL,
    orig_en TEXT NOT NULL,
    dest_tc TEXT NOT NULL,
    dest_sc TEXT NOT NULL,
    dest_en TEXT NOT NULL,
    remarks_tc TEXT,
    remarks_sc TEXT,
    remarks_en TEXT,
    description_tc TEXT NOT NULL,
    description_sc TEXT NOT NULL,
    description_en TEXT NOT NULL,
    PRIMARY KEY (route_id, route_seq)
  )
`;

  db.exec(createRouteGmbSql);
  //#endregion Create GMB Route related tables

  //#region Create RouteStopGmb table
  const createRouteStopGmbSql = `
  CREATE TABLE IF NOT EXISTS RouteStopGmb (
    route_id INTEGER NOT NULL,
    route_seq INTEGER NOT NULL,
    route_code TEXT NOT NULL,
    stop_seq INTEGER NOT NULL,
    stop_id INTEGER NOT NULL,
    name_tc TEXT NOT NULL,
    name_sc TEXT NOT NULL,
    name_en TEXT NOT NULL,
    PRIMARY KEY (route_id, route_seq, stop_seq)
  )
`;

  db.exec(createRouteStopGmbSql);
  //#endregion Create RouteStopGmb table

  //#region Create GMB Stop table
  const createStopGmbSql = `
  CREATE TABLE IF NOT EXISTS StopGmb (
    stop INTEGER PRIMARY KEY NOT NULL,
    lat REAL NOT NULL,
    long REAL NOT NULL,
    enabled INTEGER NOT NULL,
    remarks_tc TEXT,
    remarks_sc TEXT,
    remarks_en TEXT
  )
`;

  db.exec(createStopGmbSql);

  const createStopGmbIndexSql = `
  CREATE INDEX IF NOT EXISTS StopGmb_coordinates
  ON StopGmb (lat, long)
`;

  db.exec(createStopGmbIndexSql);
  //#endregion Create GMB Stop table

  self.addEventListener(
    "message",
    async (event: MessageEvent<MessageEventData>) => {
      const dataType = event.data.type;

      //#region save kmb route
      if (dataType === "database::save::kmb::route") {
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
              `('${route.bound}', '${route.dest_en.replace(
                /'/g,
                "''"
              )}', '${route.dest_sc.replace(
                /'/g,
                "''"
              )}', '${route.dest_tc.replace(
                /'/g,
                "''"
              )}', '${route.orig_en.replace(
                /'/g,
                "''"
              )}', '${route.orig_sc.replace(
                /'/g,
                "''"
              )}', '${route.orig_tc.replace(/'/g, "''")}', '${route.route}', '${
                route.service_type
              }')`
          )
          .join(", ")}
      `;

        db.exec(sql);

        self.postMessage({ type: "done::database::save::kmb::route" });

        return;
      }
      //#endregion save kmb route

      //#region save citybus route
      if (dataType === "database::save::citybus::route") {
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
              }, '${route.dest_en.replace(
                /'/g,
                "''"
              )}', '${route.dest_sc.replace(
                /'/g,
                "''"
              )}', '${route.dest_tc.replace(
                /'/g,
                "''"
              )}', '${route.orig_en.replace(
                /'/g,
                "''"
              )}', '${route.orig_sc.replace(
                /'/g,
                "''"
              )}', '${route.orig_tc.replace(/'/g, "''")}', '${route.route}')`
          )
          .join(", ")}
      `;

        db.exec(sql);

        self.postMessage({ type: "done::database::save::citybus::route" });

        return;
      }
      //#endregion save citybus route

      //#region save gmb route
      if (dataType === "database::save::gmb::route") {
        const data = event.data.data as GmbRoute[];

        const routeSql = `
        INSERT OR REPLACE INTO RouteGmb (
          route_id,
          route_seq,
          region,
          route_code,
          orig_tc,
          orig_sc,
          orig_en,
          dest_tc,
          dest_sc,
          dest_en,
          remarks_tc,
          remarks_sc,
          remarks_en,
          description_tc,
          description_sc,
          description_en
        ) VALUES ${data
          .map(
            (route) =>
              `(${route.route_id}, ${route.route_seq}, '${route.region}', '${
                route.route_code
              }', '${route.orig_tc.replace(/'/g, "''")}', '${
                route.orig_sc
              }', '${route.orig_en.replace(
                /'/g,
                "''"
              )}', '${route.dest_tc.replace(
                /'/g,
                "''"
              )}', '${route.dest_sc.replace(
                /'/g,
                "''"
              )}', '${route.dest_en.replace(/'/g, "''")}', ${
                route.remarks_tc
                  ? `'${route.remarks_tc.replace(/'/g, "''")}'`
                  : "NULL"
              }, ${
                route.remarks_sc
                  ? `'${route.remarks_sc.replace(/'/g, "''")}'`
                  : "NULL"
              }, ${
                route.remarks_en
                  ? `'${route.remarks_en.replace(/'/g, "''")}'`
                  : "NULL"
              }, '${route.description_tc.replace(
                /'/g,
                "''"
              )}', '${route.description_sc.replace(
                /'/g,
                "''"
              )}', '${route.description_en.replace(/'/g, "''")}')`
          )
          .join(", ")}
        `;

        db.exec(routeSql);

        self.postMessage({ type: "done::database::save::gmb::route" });

        return;
      }
      //#endregion save gmb route

      //#region save kmb route-stop
      if (dataType === "database::save::kmb::route-stop") {
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

        self.postMessage({ type: "done::database::save::kmb::route-stop" });

        return;
      }
      //#endregion save kmb route-stop

      //#region save citybus route-stop
      if (dataType === "database::save::citybus::route-stop") {
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

        self.postMessage({ type: "done::database::save::citybus::route-stop" });

        return;
      }
      //#endregion save citybus route-stop

      //#region save gmb route-stop
      if (dataType === "database::save::gmb::route-stop") {
        const data = event.data.data as GmbRouteStop[];

        const sql = `
        INSERT OR REPLACE INTO RouteStopGmb (
          route_id,
          route_seq,
          route_code,
          stop_seq,
          stop_id,
          name_tc,
          name_sc,
          name_en
        ) VALUES ${data
          .map(
            (routeStop) =>
              `(${routeStop.route_id}, ${routeStop.route_seq}, '${
                routeStop.route_code
              }', ${routeStop.stop_seq}, ${
                routeStop.stop_id
              }, '${routeStop.name_tc.replace(
                /'/g,
                "''"
              )}', '${routeStop.name_sc.replace(
                /'/g,
                "''"
              )}', '${routeStop.name_en.replace(/'/g, "''")}')`
          )
          .join(", ")}
        `;

        db.exec(sql);

        self.postMessage({ type: "done::database::save::gmb::route-stop" });

        return;
      }
      //#endregion save gmb route-stop

      //#region save kmb stop
      if (dataType === "database::save::kmb::stop") {
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
              )}, '${stop.name_en.replace(
                /'/g,
                "''"
              )}', '${stop.name_sc.replace(
                /'/g,
                "''"
              )}', '${stop.name_tc.replace(/'/g, "''")}', '${stop.stop}')`
          )
          .join(", ")}
      `;

        db.exec(sql);

        self.postMessage({ type: "done::database::save::kmb::stop" });

        return;
      }
      //#endregion save kmb stop

      //#region save citybus stop
      if (dataType === "database::save::citybus::stop") {
        const data = event.data.data as StopCitybus[];

        const sql = `
          INSERT OR REPLACE INTO StopCitybus (
            data_timestamp,
            lat,
            long,
            name_en,
            name_sc,
            name_tc,
            stop
          ) VALUES ${data
            .map(
              (stop) =>
                `(${
                  new Date(stop.data_timestamp).getTime() / 1000
                }, ${parseFloat(stop.lat)}, ${parseFloat(
                  stop.long
                )}, '${stop.name_en.replace(/'/g, "''")}', '${
                  stop.name_sc
                }', '${stop.name_tc.replace(/'/g, "''")}', '${stop.stop.replace(
                  /'/g,
                  "''"
                )}')`
            )
            .join(", ")}
        `;

        db.exec(sql);

        self.postMessage({ type: "done::database::save::citybus::stop" });

        return;
      }
      //#endregion save citybus stop

      //#region save gmb stop
      if (dataType === "database::save::gmb::stop") {
        const data = event.data.data as GmbStop[];

        const sql = `
          INSERT OR REPLACE INTO StopGmb (
            stop,
            lat,
            long,
            enabled,
            remarks_tc,
            remarks_sc,
            remarks_en
          ) VALUES ${data
            .map(
              (stop) =>
                `(${stop.stop}, ${stop.lat}, ${stop.long}, ${
                  stop.enabled ? 1 : 0
                }, ${
                  stop.remarks_tc
                    ? `'${stop.remarks_tc.replace(/'/g, "''")}'`
                    : "NULL"
                }, ${
                  stop.remarks_sc
                    ? `'${stop.remarks_sc.replace(/'/g, "''")}'`
                    : "NULL"
                }, ${
                  stop.remarks_en
                    ? `'${stop.remarks_en.replace(/'/g, "''")}'`
                    : "NULL"
                })`
            )
            .join(", ")}
        `;

        db.exec(sql);

        self.postMessage({ type: "done::database::save::gmb::stop" });

        return;
      }
      //# endregion save gmb stop

      //#region get nearby stops
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
          SELECT DISTINCT RouteKmb.*
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
          SELECT DISTINCT RouteCitybus.*
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

        const stopGmbSql = `
          SELECT *
          FROM StopGmb
          WHERE lat BETWEEN ${bounds.lat.lower} AND ${bounds.lat.upper}
          AND long BETWEEN ${bounds.lng.lower} AND ${bounds.lng.upper}
        `;

        const stopsGmb = db.exec({
          sql: stopGmbSql,
          rowMode: "object",
          returnValue: "resultRows",
        });

        self.postMessage({
          type: "result::nearby-stop-gmb",
          data: stopsGmb,
        });

        const routeGmbSql = `
          SELECT DISTINCT RouteGmb.*
          FROM RouteGmb
          JOIN RouteStopGmb ON RouteGmb.route_id = RouteStopGmb.route_id
          JOIN StopGmb ON RouteStopGmb.stop_id = StopGmb.stop
          WHERE StopGmb.lat BETWEEN ${bounds.lat.lower} AND ${bounds.lat.upper}
          AND StopGmb.long BETWEEN ${bounds.lng.lower} AND ${bounds.lng.upper}
        `;

        const routesGmb = db.exec({
          sql: routeGmbSql,
          rowMode: "object",
          returnValue: "resultRows",
        });

        self.postMessage({
          type: "result::nearby-route-gmb",
          data: routesGmb,
        });

        return;
      }
      //#endregion get nearby stops

      if (dataType === "ping") {
        self.postMessage({ type: "pong" });

        return;
      }

      if (dataType === "database::clear") {
        db.exec("DELETE FROM RouteKmb");
        db.exec("DELETE FROM RouteCitybus");
        db.exec("DELETE FROM RouteGmb");
        db.exec("DELETE FROM RouteStopKmb");
        db.exec("DELETE FROM RouteStopCitybus");
        db.exec("DELETE FROM RouteStopGmb");
        db.exec("DELETE FROM StopKmb");
        db.exec("DELETE FROM StopCitybus");
        db.exec("DELETE FROM StopGmb");

        self.postMessage({ type: "done::database::clear" });

        return;
      }

      if (dataType === "database::check-empty") {
        const routeKmbCount = db.exec({
          sql: "SELECT COUNT(*) AS C FROM RouteKmb",
          rowMode: "$C",
          returnValue: "resultRows",
        })[0];

        const routeCitybusCount = db.exec({
          sql: "SELECT COUNT(*) as C FROM RouteCitybus",
          rowMode: "$C",
          returnValue: "resultRows",
        })[0];

        const routeStopKmbCount = db.exec({
          sql: "SELECT COUNT(*) as C FROM RouteStopKmb",
          rowMode: "$C",
          returnValue: "resultRows",
        })[0];

        const routeStopCitybusCount = db.exec({
          sql: "SELECT COUNT(*) as C FROM RouteStopCitybus",
          rowMode: "$C",
          returnValue: "resultRows",
        })[0];

        const stopKmbCount = db.exec({
          sql: "SELECT COUNT(*) as C FROM StopKmb",
          rowMode: "$C",
          returnValue: "resultRows",
        })[0];

        const stopCitybusCount = db.exec({
          sql: "SELECT COUNT(*) as C FROM StopCitybus",
          rowMode: "$C",
          returnValue: "resultRows",
        })[0];

        const hasZero = [
          routeKmbCount,
          routeCitybusCount,
          routeStopKmbCount,
          routeStopCitybusCount,
          stopKmbCount,
          stopCitybusCount,
        ].some((count) => count === 0);

        self.postMessage({
          type: "result::database::check-empty",
          data: hasZero,
        });
      }
    }
  );
};

main();
