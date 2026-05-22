// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  designSystemAncestorObservedAttributeFilter,
  designSystemHostObservedAttributeFilter,
} from "../constants";

const observeNode = (
  observer: MutationObserver | null,
  observedNodes: Set<Node>,
  node: Node,
  observeChildList: boolean,
): void => {
  if (!observer || observedNodes.has(node)) {
    return;
  }

  observedNodes.add(node);
  observer.observe(node, {
    attributes: true,
    childList: observeChildList,
    subtree: false,
    attributeFilter: [...designSystemAncestorObservedAttributeFilter],
  });
};

export const observeHostChain = (
  host: HTMLElement,
  observer: MutationObserver | null,
  observedNodes: Set<Node>,
): void => {
  if (!observer) {
    return;
  }

  const chain: Node[] = [host];
  let current: HTMLElement | null = host.parentElement;
  while (current) {
    chain.push(current);
    current = current.parentElement;
  }

  if (chain.length === observedNodes.size && chain.every((node) => observedNodes.has(node))) {
    return;
  }

  observer.disconnect();
  observedNodes.clear();
  observedNodes.add(host);
  observer.observe(host, {
    attributes: true,
    childList: false,
    subtree: false,
    attributeFilter: [...designSystemHostObservedAttributeFilter],
  });

  let ancestor: HTMLElement | null = host.parentElement;
  while (ancestor) {
    observeNode(observer, observedNodes, ancestor, true);
    ancestor = ancestor.parentElement;
  }
};
