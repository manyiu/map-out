const sqliteWorker = new Worker(
  new URL("./sqlite.ts?worker", import.meta.url),
  {
    type: "module",
  }
);

const fetchWorker = new Worker(new URL("./fetch.ts?worker", import.meta.url), {
  type: "module",
});

export { fetchWorker, sqliteWorker };
