import { Injectable, Inject } from "@nestjs/common";
import { cp, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

import { MediaConfigService } from "./media-config.service";

export type StorageVisibility = "PRIVATE" | "PUBLIC";

@Injectable()
export class LocalMediaStorageService {
  private readonly publicRoot: string;
  private readonly privateRoot: string;
  constructor(@Inject(MediaConfigService) config: MediaConfigService) {
    this.publicRoot = resolve(process.cwd(), config.value.MEDIA_LOCAL_PUBLIC_ROOT);
    this.privateRoot = resolve(process.cwd(), config.value.MEDIA_LOCAL_PRIVATE_ROOT);
    if (this.publicRoot === this.privateRoot)
      throw new Error("Public and private media roots must differ");
  }

  private root(visibility: StorageVisibility) {
    return visibility === "PUBLIC" ? this.publicRoot : this.privateRoot;
  }
  private path(visibility: StorageVisibility, key: string) {
    if (!/^[0-9a-f-]{36}\/(?:original|large|gallery|thumbnail)\.webp$/.test(key))
      throw new Error("Invalid managed media key");
    const root = this.root(visibility);
    const target = resolve(root, key);
    if (!target.startsWith(`${root}${sep}`))
      throw new Error("Managed media path escaped its storage root");
    return target;
  }
  async initialize() {
    await Promise.all([
      mkdir(this.publicRoot, { recursive: true }),
      mkdir(this.privateRoot, { recursive: true }),
    ]);
  }
  async write(visibility: StorageVisibility, key: string, data: Buffer) {
    const target = this.path(visibility, key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data, { flag: "wx" });
  }
  async read(visibility: StorageVisibility, key: string) {
    return readFile(this.path(visibility, key));
  }
  async size(visibility: StorageVisibility, key: string) {
    return (await stat(this.path(visibility, key))).size;
  }
  async exists(visibility: StorageVisibility, key: string) {
    try {
      await stat(this.path(visibility, key));
      return true;
    } catch {
      return false;
    }
  }
  async deleteMedia(visibility: StorageVisibility, mediaId: string) {
    if (!/^[0-9a-f-]{36}$/.test(mediaId)) throw new Error("Invalid media identifier");
    await rm(resolve(this.root(visibility), mediaId), { recursive: true, force: true });
  }
  async moveMedia(mediaId: string, from: StorageVisibility, to: StorageVisibility) {
    if (!/^[0-9a-f-]{36}$/.test(mediaId)) throw new Error("Invalid media identifier");
    const source = resolve(this.root(from), mediaId);
    const target = resolve(this.root(to), mediaId);
    await mkdir(dirname(target), { recursive: true });
    try {
      await rename(source, target);
    } catch {
      await cp(source, target, { recursive: true, errorOnExist: true });
      await rm(source, { recursive: true, force: true });
    }
  }
  safeDebugName(visibility: StorageVisibility, key: string) {
    return `${visibility.toLowerCase()}:${relative(this.root(visibility), this.path(visibility, key)).replaceAll("\\", "/")}`;
  }
}
