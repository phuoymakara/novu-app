<script setup lang="ts">
import type { Cat } from "~/repositories/cats.repo";

const { $api } = useNuxtApp();
const { data: cats, refresh, status } = await useAsyncData<Cat[]>("cats", () =>
  $api.cat.getList({ limit: 10 })
);
</script>

<template>
  <div>
      <UPageSection title="Cats Gallery">
      <div class="flex justify-end mb-4">
        <UButton
          label="Refetch"
          icon="i-lucide-refresh-cw"
          :loading="status === 'pending'"
          @click="() => refresh()"
        />
      </div>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <img
          v-for="cat in cats"
          :key="cat.id"
          :src="cat.url"
          :width="cat.width"
          :height="cat.height"
          class="w-full rounded-lg object-cover aspect-square"
        />
      </div>
    </UPageSection>
  </div>
</template>
