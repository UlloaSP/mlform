import { describe, expect, it } from "vitest";
import { createTransportRequestRunner } from "@/transport";

const deferred = <T>() => {
  let resolve = (_value: T): void => {};
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
};

describe("transport request runner", () => {
  it("marks the replaced operation stale", async () => {
    const runner = createTransportRequestRunner();
    const firstResult = deferred<string>();
    const secondResult = deferred<string>();

    const first = runner.run(() => firstResult.promise);
    const second = runner.run(() => secondResult.promise);
    firstResult.resolve("obsolete");

    await expect(first).resolves.toEqual({ status: "aborted", stale: true });

    secondResult.resolve("current");
    await expect(second).resolves.toEqual({ status: "completed", value: "current", stale: false });
  });

  it("keeps an externally aborted current operation non-stale", async () => {
    const runner = createTransportRequestRunner();
    const result = deferred<string>();
    const controller = new AbortController();
    const request = runner.run(() => result.promise, [controller.signal]);

    controller.abort("cancelled");
    result.resolve("ignored");

    await expect(request).resolves.toEqual({ status: "aborted", stale: false });
  });

  it("marks a completed outcome stale when a new run starts before its consumer resumes", async () => {
    const runner = createTransportRequestRunner();
    const firstResult = deferred<string>();
    const secondResult = deferred<string>();
    const first = runner.run(() => firstResult.promise);
    let second: ReturnType<typeof runner.run<string>> | undefined;
    void firstResult.promise.then(() => {
      second = runner.run(() => secondResult.promise);
    });

    firstResult.resolve("obsolete");
    await expect(first).resolves.toEqual({ status: "completed", value: "obsolete", stale: true });

    secondResult.resolve("current");
    await expect(second).resolves.toEqual({ status: "completed", value: "current", stale: false });
  });

  it("invalidates the current outcome when the runner is explicitly aborted", async () => {
    const runner = createTransportRequestRunner();
    const result = deferred<string>();
    const request = runner.run(() => result.promise);

    runner.abort("disposed");
    result.resolve("ignored");

    await expect(request).resolves.toEqual({ status: "aborted", stale: true });
  });
});
