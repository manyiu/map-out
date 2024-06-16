import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import { RouteStopV1, RouteStopV2, RouteV1, RouteV2 } from "../hooks/types";

const sqlite3 = await sqlite3InitModule({});

const db = new sqlite3.oo1.OpfsDb("/map-out.sqlite3");

db.exec(
  `
    CREATE TABLE IF NOT EXISTS Stop (
      id TEXT PRIMARY KEY NOT NULL,
      name_en TEXT NOT NULL,
      name_tc TEXT NOT NULL,
      name_sc TEXT NOT NULL,
      lat REAL NOT NULL,
      long REAL NOT NULL
    )
  `
);

db.exec(
  `
    CREATE INDEX IF NOT EXISTS Stop_lat_long
    ON Stop (lat, long)
  `
);

db.exec(
  `
    CREATE TABLE IF NOT EXISTS RouteV1 (
      route TEXT NOT NULL,
      bound CHAR(1) NOT NULL,
      service_type INTEGER NOT NULL,
      orig_en TEXT NOT NULL,
      orig_tc TEXT NOT NULL,
      orig_sc TEXT NOT NULL,
      dest_en TEXT NOT NULL,
      dest_tc TEXT NOT NULL,
      dest_sc TEXT NOT NULL,
      PRIMARY KEY (route, bound, service_type)
    )
  `
);

db.exec(
  `
    CREATE TABLE IF NOT EXISTS RouteV2 (
      id TEXT PRIMARY KEY NOT NULL,
      co TEXT NOT NULL,
      data_timestamp DATETIME NOT NULL,
      orig_en TEXT NOT NULL,
      orig_tc TEXT NOT NULL,
      orig_sc TEXT NOT NULL,
      dest_en TEXT NOT NULL,
      dest_tc TEXT NOT NULL,
      dest_sc TEXT NOT NULL
    )
  `
);

db.exec(
  `
    CREATE TABLE IF NOT EXISTS RouteStop (
      route TEXT NOT NULL,
      stop TEXT NOT NULL,
      seq INTEGER NOT NULL,
      dir CHAR(1) NOT NULL,
      co TEXT,
      service_type INTEGER,
      data_timestamp DATETIME,
      PRIMARY KEY (route, stop, seq)
    )
  `
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface MessageEventData<T = any> {
  type: string;
  data: T;
}

self.onmessage = async (event: MessageEvent<MessageEventData>) => {
  const dataType = event.data.type;

  if (dataType === "route-v1") {
    const sql = `
        INSERT OR REPLACE INTO RouteV1 (route, bound, service_type, orig_en, orig_tc, orig_sc, dest_en, dest_tc, dest_sc)
        VALUES ${event.data.data
          .map(
            (route: RouteV1) =>
              `('${route.route}', '${route.bound}', ${
                route.service_type
              }, '${route.orig_en.replace("'", "''")}', '${route.orig_tc}', '${
                route.orig_sc
              }', '${route.dest_en.replace("'", "''")}', '${route.dest_tc}', '${
                route.dest_sc
              }')`
          )
          .join(", ")}
      `;

    db.exec(sql);

    return;
  }

  if (dataType === "route-v2") {
    const sql = `
        INSERT OR REPLACE INTO RouteV2 (id, co, data_timestamp, orig_en, orig_tc, orig_sc, dest_en, dest_tc, dest_sc)
        VALUES ${event.data.data
          .map(
            (route: RouteV2) =>
              `('${route.route}', '${route.co}', ${
                new Date(route.data_timestamp).getTime() / 1000
              }, '${route.orig_en.replace("'", "''")}', '${route.orig_tc}', '${
                route.orig_sc
              }', '${route.dest_en.replace("'", "''")}', '${route.dest_tc}', '${
                route.dest_sc
              }')`
          )
          .join(", ")}
      `;

    db.exec(sql);

    return;
  }

  if (dataType === "route-stop-v1") {
    const sql = `
        INSERT OR REPLACE INTO RouteStop (route, stop, seq, dir, service_type)
        VALUES ${event.data.data
          .map(
            (routeStop: RouteStopV1) =>
              `('${routeStop.route}', '${routeStop.stop}', ${parseFloat(
                routeStop.seq
              )}, '${routeStop.bound}', ${routeStop.service_type})`
          )
          .join(", ")}
      `;

    db.exec(sql);

    return;
  }

  if (dataType === "route-stop-v2") {
    if (event.data.data.length === 0) {
      return;
    }

    const sql = `
      INSERT OR REPLACE INTO RouteStop (route, stop, seq, dir, co, data_timestamp)
      VALUES ${event.data.data
        .map(
          (routeStop: RouteStopV2) =>
            `('${routeStop.route}', '${routeStop.stop}', ${routeStop.seq}, '${
              routeStop.dir
            }', '${routeStop.co}', ${
              new Date(routeStop.data_timestamp).getTime() / 1000
            })`
        )
        .join(", ")}
    `;

    db.exec(sql);
  }

  if (dataType === "stop") {
    const sql = `
        INSERT OR REPLACE INTO Stop (id, name_en, name_tc, name_sc, lat, long)
        VALUES ${event.data.data
          .map(
            (stop: {
              stop: string;
              name_en: string;
              name_tc: string;
              name_sc: string;
              lat: string;
              long: string;
            }) =>
              `('${stop.stop}', '${stop.name_en.replace("'", "''")}', '${
                stop.name_tc
              }', '${stop.name_sc}', ${parseFloat(stop.lat)}, ${parseFloat(
                stop.long
              )})`
          )
          .join(", ")}
      `;

    db.exec(sql);
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

    const stopSql = `
      SELECT *
      FROM Stop
      WHERE lat BETWEEN ${bounds.lat.lower} AND ${bounds.lat.upper}
      AND long BETWEEN ${bounds.lng.lower} AND ${bounds.lng.upper}
    `;

    const stops = db.exec({
      sql: stopSql,
      rowMode: "object",
      returnValue: "resultRows",
    });

    self.postMessage({
      type: "result::stops",
      data: stops,
    });

    const routeV1Sql = `
      SELECT DISTINCT RouteV1.route, null as co, RouteV1.bound, null as data_timestamp, RouteV1.service_type, RouteV1.orig_en, RouteV1.orig_tc, RouteV1.orig_sc, RouteV1.dest_en, RouteV1.dest_tc, RouteV1.dest_sc
      FROM RouteV1
      JOIN RouteStop ON RouteV1.route = RouteStop.route
      JOIN Stop ON RouteStop.stop = Stop.id
      WHERE Stop.lat BETWEEN ${bounds.lat.lower} AND ${bounds.lat.upper}
      AND Stop.long BETWEEN ${bounds.lng.lower} AND ${bounds.lng.upper}
    `;

    const routeV2Sql = `
      SELECT DISTINCT RouteV2.id, RouteV2.co, null, RouteV2.data_timestamp, null, RouteV2.orig_en, RouteV2.orig_tc, RouteV2.orig_sc, RouteV2.dest_en, RouteV2.dest_tc, RouteV2.dest_sc
      FROM RouteV2
      JOIN RouteStop ON RouteV2.id = RouteStop.route
      JOIN Stop ON RouteStop.stop = Stop.id
      WHERE Stop.lat BETWEEN ${bounds.lat.lower} AND ${bounds.lat.upper}
      AND Stop.long BETWEEN ${bounds.lng.lower} AND ${bounds.lng.upper}
    `;

    const routeSql = `
      ${routeV1Sql}
      UNION ALL
      ${routeV2Sql}
    `;

    const routes = db.exec({
      sql: routeSql,
      rowMode: "object",
      returnValue: "resultRows",
    });

    self.postMessage({
      type: "result::routes",
      data: routes,
    });
  }
};
