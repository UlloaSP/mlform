---
title: Vue
description: Mount MLForm in a Vue component.
---

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { mountForm, type MountedForm } from "mlform/kit";
import { predictionTransport } from "./prediction-transport";

const host = ref<HTMLElement | null>(null);
let mounted: MountedForm | null = null;

onMounted(() => {
  if (!host.value) return;

  mounted = mountForm(host.value, {
    transport: predictionTransport,
    schema: {
      fields: [{ id: "prompt", kind: "text", label: "Prompt", required: true }],
      reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
    },
  });
});

onBeforeUnmount(() => mounted?.unmount());
</script>

<template>
  <div ref="host" />
</template>
```
