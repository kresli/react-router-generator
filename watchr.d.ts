declare module "watchr" {
  export interface Watchr {
    close(): void;
  }
  function open(
    path: string,
    callback: (
      changeType: "update" | "create" | "delete",
      fullPath: "string"
    ) => void,
    next: (err: string) => void
  ): Watchr;
}
