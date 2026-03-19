import type { NitroFetchRequest, $Fetch } from "nitropack";

export interface Cat {
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface CatFilter {
  limit?: number;
  page?: number;
  breed_ids?: string;
}

export const catRepository = <T>(fetcher: $Fetch<T, NitroFetchRequest>) => ({
  getList: (filter: CatFilter = {}) =>
    fetcher<Cat[]>("/api/images/search", { query: filter }),
});
