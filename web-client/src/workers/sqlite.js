import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

sqlite3InitModule({}).then((sqlite3) => {
  const capi = sqlite3.capi; /*C-style API*/
  const oo = sqlite3.oo1; /*high-level OO API*/
  console.log(
    "sqlite3 version",
    capi.sqlite3_libversion(),
    capi.sqlite3_sourceid()
  );
  let db;
  console.log(oo.OpfsDb);
  if (sqlite3.opfs) {
    console.log(sqlite3.opfs);
    // db = new sqlite3.opfs.OpfsDb("/mydb.sqlite3");
    db = new oo.OpfsDb("/mydb.sqlite3");
    console.log("The OPFS is available.");
  } else {
    db = new oo.DB("/mydb.sqlite3", "ct");
    console.log("The OPFS is not available.");
  }
  console.log("transient db =", db.filename);

  try {
    console.log("Create a table...");
    db.exec("CREATE TABLE IF NOT EXISTS t(a,b)");
    console.log("Insert some data using exec()...");
    let i;
    for (i = 20; i <= 25; ++i) {
      db.exec({
        sql: "insert into t(a,b) values (?,?)",
        bind: [i, i * 2],
      });
    }
    console.log("Query data with exec() using rowMode 'array'...");
    db.exec({
      sql: "select a from t order by a limit 3",
      rowMode: "array", // 'array' (default), 'object', or 'stmt'
      callback: function (row) {
        console.log("row ", ++this.counter, "=", row);
      }.bind({ counter: 0 }),
    });

    postMessage({ type: "done" });
  } finally {
    db.close();
  }
});
