// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { EngineStore } from "../state";
import type { SubmissionProgressState, TransportStreamEvent } from "../types";

export const updateStreamProgress = (
  store: EngineStore,
  currentRequestId: () => number | null,
  progress: SubmissionProgressState,
  submissionRequestId: number,
  lifecycleVersion: number,
): void => {
  if (
    currentRequestId() !== submissionRequestId ||
    store.getState().lifecycleVersion !== lifecycleVersion
  ) {
    return;
  }

  store.update((current) => ({
    ...current,
    submissionProgress: progress,
  }));
};

export const toSubmissionProgress = (
  previous: SubmissionProgressState | null,
  event: TransportStreamEvent,
): SubmissionProgressState => {
  const base: SubmissionProgressState = previous ?? {
    meta: {},
    chunkCount: 0,
  };

  switch (event.type) {
    case "progress":
      return {
        ...base,
        loaded: event.loaded ?? base.loaded,
        total: event.total ?? base.total,
        message: event.message ?? base.message,
        meta: {
          ...base.meta,
          ...event.meta,
        },
        lastEventType: event.type,
      };
    case "meta":
      return {
        ...base,
        sessionState:
          event.meta.sessionClosed === true
            ? "closed"
            : event.meta.sessionOpening === true
              ? "opening"
              : event.meta.sessionOpen === true
                ? "open"
                : event.meta.sessionClosing === true
                  ? "closing"
                  : base.sessionState,
        bufferedMessages:
          typeof event.meta.bufferedMessages === "number"
            ? event.meta.bufferedMessages
            : base.bufferedMessages,
        meta: {
          ...base.meta,
          ...event.meta,
        },
        lastEventType: event.type,
      };
    case "chunk":
      return {
        ...base,
        chunkCount: base.chunkCount + 1,
        sessionState: event.meta?.session === true ? "open" : base.sessionState,
        bufferedMessages:
          typeof event.meta?.bufferedMessages === "number"
            ? event.meta.bufferedMessages
            : base.bufferedMessages,
        sessionMessageCount:
          event.meta?.session === true
            ? (base.sessionMessageCount ?? 0) + 1
            : base.sessionMessageCount,
        lastSessionMessageType:
          event.meta?.session === true && typeof event.meta?.messageType === "string"
            ? event.meta.messageType
            : base.lastSessionMessageType,
        meta: {
          ...base.meta,
          ...event.meta,
        },
        lastEventType: event.type,
      };
    case "report-replace":
    case "report-patch":
    case "field-update":
    case "result":
    case "error":
      return {
        ...base,
        meta: {
          ...base.meta,
          ...event.meta,
        },
        lastEventType: event.type,
      };
  }
};
