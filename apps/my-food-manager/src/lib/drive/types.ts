import type { DriveFileRef } from "@/lib/domain/snapshot";

/** Where the `food` folder is read from. Production: Drive. Development: a local mirror. */
export interface FoodSource {
  list(): Promise<DriveFileRef[]>;
  readText(file: DriveFileRef): Promise<string>;
  readBytes(file: DriveFileRef): Promise<Uint8Array>;
  /**
   * Replaces the text of an existing file. Fails with `DriveConflictError` when the file's
   * modified time is not `file.modifiedTime` (someone else wrote it since it was listed).
   */
  writeText(file: DriveFileRef, text: string): Promise<void>;
}

export class DriveConflictError extends Error {
  constructor() {
    super("El archivo cambió en Drive mientras se guardaba");
    this.name = "DriveConflictError";
  }
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
