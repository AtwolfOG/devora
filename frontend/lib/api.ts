
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";


let access_token: string = "";
let tokenPromise: Promise<string> | null = null;

const googleCallbackPath = "/auth/callback/google";
const githubCallbackPath = "/auth/callback/github";
const refreshPath = "/auth/refresh";
const loginPath = "/auth/login";
const signupPath = "/auth/signup";
const verifyPath = "/auth/verify";
const excludePaths = [
  googleCallbackPath,
  githubCallbackPath,
  refreshPath,
  loginPath,
  signupPath,
  verifyPath,
]
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,

  withCredentials: true,
});


api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (excludePaths.some((path) => config.url?.includes(path))) return config;
    if (config.url?.includes("/auth")) return config;
    console.log("request: ", config);
    const token = await getAccessToken();
    
    // attach access token automatically
    config.headers.Authorization = `Bearer ${token}`;

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// get access token 
export async function getAccessToken(): Promise<string> {
  if (access_token) {
    return access_token;
  }

  if (tokenPromise) {
    return tokenPromise;
  }
  tokenPromise = (async () => {
    try {
      const response = await api.post(refreshPath);

      access_token = response.data.access_token;

      return access_token;
    } finally {
      tokenPromise = null;
    }
  })();

  return tokenPromise;
}

// RESPONSE INTERCEPTOR

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // TODO: remove this
    console.log("response: ", response);
    if (
      response.data?.accessToken &&
      !excludePaths.some((path) => response.config.url?.includes(path))
    ) {
      access_token = response.data.accessToken;
    }
    return response;
  },

  async (error: AxiosError) => {
    if (error.config && excludePaths.some((path) => error.config?.url?.includes(path))) {
      return Promise.reject(error);
    }
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // if not unauthorized -> reject immediately
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // avoid infinite loop
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

        try {
        access_token = "";

        const token = await getAccessToken();

        originalRequest.headers.Authorization = `Bearer ${token}`;

        return api(originalRequest);

    } catch (refreshError) {
      processQueue(refreshError, null);
      // logout user
      window.location.href = "/auth/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);