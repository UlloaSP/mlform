---
title: Vue
description: Monta MLForm con ref, onMounted y onBeforeUnmount.
---

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { createJsonTransport, mountForm, type MountedForm } from "mlform";

const host = ref<HTMLElement | null>(null);
let mounted: MountedForm | undefined;

onMounted(() => {
  if (!host.value) return;
  mounted = mountForm(host.value, {
    transport: createJsonTransport({ endpoint: "/api/predict" }),
    schema,
  });
});

onBeforeUnmount(() => mounted?.unmount());
</script>

<template>
  <div ref="host" />
</template>
```
