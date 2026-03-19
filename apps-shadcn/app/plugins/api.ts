import type { FetchOptions } from "ofetch";
import { catRepository } from "../repositories/cats.repo";

interface IAuthResponse {
  error: number;
  message?: string;
  data: any;
}

export default defineNuxtPlugin(() => {
  const fetchOptions: FetchOptions = {
    onRequest: ({ options }) => {
      options.headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };
    },
    onResponseError: async ({ response, request, options }) => {
      if (response.status === 401) {
        try {
          const refreshResponse: IAuthResponse = await $fetch("/api/auth/refresh-token", {
            method: "POST",
          });

          if (!refreshResponse || refreshResponse.error === 1) {
            await navigateTo("/auth/login");
            return;
          }

          /**
           * Re-fetch data for current page with new access_token after refreshed token
           * @link https://nuxt.com/docs/4.x/api/utils/refresh-nuxt-data
           */
          await refreshNuxtData();
        } catch {
          await navigateTo("/auth/login");
          return;
        }
      }

      throw createError({
        statusCode: response.status,
        statusMessage: response._data?.message || "An error occurred",
        data: response._data,
      });
    },
  };

  const fetcher = $fetch.create(fetchOptions);

  return {
    provide: {
      api: {
        cat: catRepository(fetcher),
      },
    },
  };
});
