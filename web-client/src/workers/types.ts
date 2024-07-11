// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface MessageEventData<T = any, U = any> {
  type: string;
  params?: U;
  data: T;
}
