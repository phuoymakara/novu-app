<template>
  <UApp :toaster="{position:'top-right'}">
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <GlobalConfirmModal />
  </UApp>
</template>
<script setup lang="ts">
const url = useRequestURL();
const SITE_NAME = "Novu App";
const SITE_DESCRIPTION = "Daily OS";

useHead({
  title: SITE_NAME,
});
useSeoMeta({
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  ogTitle: SITE_NAME,
  ogDescription: SITE_DESCRIPTION,
  ogSiteName: SITE_NAME,
  ogUrl: url.href,
  twitterCard: "summary_large_image",
  twitterTitle: SITE_NAME,
  twitterDescription: SITE_DESCRIPTION,
  ogImage: `${url.origin}/og.png`,
  twitterImage: `${url.origin}/og.png`,
});
</script>
