const worker = new Worker(new URL("./sqlite.ts", import.meta.url), {
  type: "module",
});

export default worker;
