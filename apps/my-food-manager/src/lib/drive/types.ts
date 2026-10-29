import type { DriveFileRef } from "@/lib/domain/snapshot";

/** Where the `food` folder is read from. Production: Drive. Development: a local mirror. */
export interface FoodSource {
  list(): Promise<DriveFileRef[]>;
  readText(file: DriveFileRef): Promise<string>;
  readBytes(file: DriveFileRef): Promise<Uint8Array>;
}

export class DriveReadError extends Error {
  constructor(
    message: string,
    readonly code: "DRIVE_UNAVAILABLE" | "DRIVE_FORBIDDEN",
  ) {
    super(message);
    this.name = "DriveReadError";
  }
}
