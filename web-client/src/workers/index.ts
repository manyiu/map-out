const dbWorker = new Worker(new URL("./db.ts?worker", import.meta.url), {
  type: "module",
});

const fetchWorker = new Worker(new URL("./fetch.ts?worker", import.meta.url), {
  type: "module",
});

export { dbWorker, fetchWorker };
