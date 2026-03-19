import { joinURL } from "ufo";

const COOKIE_DEFAULTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const response = await $fetch<{
    access_token: string;
    refresh_token: string;
  }>(joinURL(config.apiUrl, "/auth/login"), {
    method: "POST",
    body,
  });

  setCookie(event, "access_token", response.access_token, {
    ...COOKIE_DEFAULTS,
    maxAge: 60 * 15, // 15 minutes
  });

  setCookie(event, "refresh_token", response.refresh_token, {
    ...COOKIE_DEFAULTS,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return { error: 0 };
});
