const worker = new Worker(new URL("./sqlite.ts?worker", import.meta.url), {
  type: "module",
});

export default worker;
