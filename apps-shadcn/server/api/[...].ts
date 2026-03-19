import { joinURL } from "ufo";

const serviceMap: Record<string, string> = {
  authentication: "authUrl",
};

export default defineEventHandler((event) => {
  const config = useRuntimeConfig();
  const path = event.path.replace(/^\/api\//, "");
  const [prefix] = path.split("/");

  const baseUrl = (serviceMap[prefix] ? config[serviceMap[prefix]] : undefined) ?? config.apiUrl;
  const target = joinURL(baseUrl, config.apiVersion, path);
  const accessToken = getCookie(event, "access_token");
  console.log("=====Proxy Target=====",target)
  return proxyRequest(event, target, {
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : {},
  });
});
