import { joinURL } from "ufo";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const refreshToken = getCookie(event, "refresh_token");

  if (!refreshToken) {
    return { error: 1, message: "No refresh token" };
  }

  try {
    const response = await $fetch<{ access_token: string }>(
      joinURL(config.apiUrl, "/auth/refresh-token"),
      {
        method: "POST",
        headers: { authorization: `Bearer ${refreshToken}` },
      }
    );

    setCookie(event, "access_token", response.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15, // 15 minutes
    });

    return { error: 0 };
  } catch {
    deleteCookie(event, "access_token");
    deleteCookie(event, "refresh_token");
    return { error: 1, message: "Refresh token expired" };
  }
});
