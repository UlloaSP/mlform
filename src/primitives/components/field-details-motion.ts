// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { LitElement, ReactiveController } from "lit";

/** Animate measured details, including wrapped messages, without fixed max-heights. */
export class FieldDetailsMotion implements ReactiveController {
  #observer?: ResizeObserver;
  #heights = new Map<HTMLElement, number>();
  #messages = new Map<HTMLElement, string>();
  #animations = new Map<HTMLElement, Animation>();

  constructor(private readonly host: LitElement) {
    host.addController(this);
  }

  hostUpdated(): void {
    if (typeof ResizeObserver === "undefined") return;
    this.#observer ??= new ResizeObserver(() => this.#sync());
    this.#observer.disconnect();
    for (const content of this.host.renderRoot.querySelectorAll(".details-content")) {
      this.#observer.observe(content);
    }
    for (const slot of this.#heights.keys()) {
      if (!slot.isConnected) this.#heights.delete(slot);
    }
    for (const content of this.#messages.keys()) {
      if (!content.isConnected) this.#messages.delete(content);
    }
    for (const [element, animation] of this.#animations) {
      if (!element.isConnected) {
        animation.cancel();
        this.#animations.delete(element);
      }
    }
    this.#sync();
  }

  hostDisconnected(): void {
    this.#observer?.disconnect();
    this.#animations.forEach((animation) => animation.cancel());
    this.#animations.clear();
    this.#heights.clear();
    this.#messages.clear();
  }

  #sync(): void {
    const reduced = this.host.ownerDocument.defaultView?.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    for (const content of this.host.renderRoot.querySelectorAll<HTMLElement>(".details-content")) {
      const slot = content.parentElement!;
      const style = getComputedStyle(slot);
      const timing = style.getPropertyValue("--mlf-transition-duration").trim();
      const duration = reduced
        ? 0
        : (Number.parseFloat(timing) || 0) * (timing.endsWith("ms") ? 1 : 1000);
      const messageKey = `${slot.className}:${Boolean(content.textContent?.trim())}`;
      const previousMessage = this.#messages.get(content);
      this.#messages.set(content, messageKey);
      if (
        duration > 0 &&
        previousMessage !== undefined &&
        previousMessage !== messageKey &&
        content.animate
      ) {
        this.#animations.get(content)?.cancel();
        const fade = content.animate({ opacity: [0, 1] }, { duration, easing: "ease-out" });
        this.#animations.set(content, fade);
        fade.onfinish = () => this.#animations.delete(content);
      }
      const minimum = Number.parseFloat(style.minHeight) || 0;
      const height = Math.max(
        minimum,
        slot.getAttribute("aria-hidden") === "true" ? 0 : content.getBoundingClientRect().height,
      );
      if (this.#heights.get(slot) === height) continue;
      const previous = this.#heights.has(slot) ? slot.getBoundingClientRect().height : height;
      this.#animations.get(slot)?.cancel();
      this.#heights.set(slot, height);
      slot.style.height = `${height}px`;
      if (duration > 0 && previous !== height && slot.animate) {
        const animation = slot.animate(
          { height: [`${previous}px`, `${height}px`] },
          { duration, easing: "ease-out" },
        );
        this.#animations.set(slot, animation);
        animation.onfinish = () => this.#animations.delete(slot);
      }
    }
  }
}
