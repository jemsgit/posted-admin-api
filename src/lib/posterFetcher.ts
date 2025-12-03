import axios, { Axios, AxiosRequestConfig, AxiosResponse } from "axios";
import config from "../config";

class PosterFetcher {
  fetcher: Axios;
  token: string;

  constructor(baseURL: string, token: string) {
    this.fetcher = axios.create({
      withCredentials: true,
      baseURL,
    });
    this.token = Buffer.from(token).toString("base64");
    console.log(this.token);
  }

  get<T>(
    path: string,
    params: Record<string, string> | undefined = {},
    config: AxiosRequestConfig<any> | undefined = {}
  ): Promise<AxiosResponse<T>> {
    return this.fetcher.get(path, {
      ...config,
      params: { ...(params || {}) },
      headers: {
        ...(config.headers || {}),
        Authorization: `Bearer ${this.token}`,
      },
    });
  }

  post<K, T>(
    path: string,
    data: K,
    config: AxiosRequestConfig<any> | undefined = {}
  ): Promise<AxiosResponse<T>> {
    return this.fetcher.post(path, data, {
      ...config,
      headers: {
        ...(config.headers || {}),
        Authorization: `Bearer ${this.token}`,
      },
    });
  }

  patch<K, T>(
    path: string,
    data: K,
    config: AxiosRequestConfig<any> | undefined = {}
  ): Promise<AxiosResponse<T>> {
    return this.fetcher.patch(path, data, {
      ...config,
      headers: {
        ...(config.headers || {}),
        Authorization: `Bearer ${this.token}`,
      },
    });
  }
}

export default new PosterFetcher(config.posterApiUrl, config.posterApiToken);
