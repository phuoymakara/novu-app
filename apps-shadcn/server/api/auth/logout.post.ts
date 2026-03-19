export default defineEventHandler((event) => {
  const COOKIE_CLEAR = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  deleteCookie(event, "access_token", COOKIE_CLEAR);
  deleteCookie(event, "refresh_token", COOKIE_CLEAR);

  return { error: 0 };
});
