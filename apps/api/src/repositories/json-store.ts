
import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Serializes writes within this Node.js process.
 *
 * This prevents two concurrent operations against the same store
 * from overwriting each other's updates.
 *
 * This is not a cross-process or distributed lock.
 */
const writeQueues = new Map<string, Promise<void>>();

/**
 * Provides typed access to a JSON array stored on disk.
 */
export class JsonStore<T extends { id: string }> {
  private readonly filePath: string;

  constructor(fileName: string) {
    this.filePath = join(process.cwd(), "src", "data", fileName);
  }

  /**
   * Reads existing records.
   *
   * Missing files are initialized as empty arrays.
   * Malformed JSON is reported instead of silently destroying data.
   */
  async getAll(): Promise<T[]> {
    await mkdir(dirname(this.filePath), { recursive: true });

    try {
      const contents = await readFile(this.filePath, "utf8");
      const records: unknown = JSON.parse(contents);

      if (
        !Array.isArray(records) ||
        !records.every(
          (record) =>
            typeof record === "object" &&
            record !== null &&
            typeof record.id === "string",
        )
      ) {
        throw new Error(
          `Invalid JSON store structure: ${this.filePath}`,
        );
      }

      return records as T[];
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        await this.writeAll([]);
        return [];
      }

      throw error;
    }
  }

  async getById(id: string): Promise<T | undefined> {
    const records = await this.getAll();
    return records.find((record) => record.id === id);
  }

  async create(record: T): Promise<T> {
    return this.withWriteLock(async () => {
      const records = await this.getAll();

      if (records.some((item) => item.id === record.id)) {
        throw new Error(`Record already exists: ${record.id}`);
      }

      records.push(record);
      await this.writeAll(records);

      return record;
    });
  }

  async update(id: string, updates: Partial<T>): Promise<T | undefined> {
    return this.withWriteLock(async () => {
      const records = await this.getAll();
      const index = records.findIndex((record) => record.id === id);

      if (index === -1) {
        return undefined;
      }

      // Keep the original ID stable.
      records[index] = {
        ...records[index],
        ...updates,
        id,
      };

      await this.writeAll(records);
      return records[index];
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.withWriteLock(async () => {
      const records = await this.getAll();
      const remaining = records.filter((record) => record.id !== id);

      if (remaining.length === records.length) {
        return false;
      }

      await this.writeAll(remaining);
      return true;
    });
  }

  /**
   * Atomically replaces the JSON file using a temporary file.
   *
   * The temporary file is created beside the destination so the
   * rename normally stays on the same filesystem.
   */
  private async writeAll(records: T[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });

    const temporaryPath =
      `${this.filePath}.${process.pid}.tmp`;

    await writeFile(
      temporaryPath,
      JSON.stringify(records, null, 2),
      "utf8",
    );

    await rename(temporaryPath, this.filePath);
  }

  /**
   * Queues mutations so concurrent writes in this process are serialized.
   */
  private async withWriteLock<R>(
    operation: () => Promise<R>,
  ): Promise<R> {
    const previous = writeQueues.get(this.filePath) ?? Promise.resolve();

    let release!: () => void;

    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    const queued = previous.then(() => current);

    writeQueues.set(this.filePath, queued);

    await previous;

    try {
      return await operation();
    } finally {
      release();

      if (writeQueues.get(this.filePath) === queued) {
        writeQueues.delete(this.filePath);
      }
    }
  }
}
