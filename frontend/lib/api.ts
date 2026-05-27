
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";


let access_token: string = "";

const excludePaths = [
  "/auth/callback/google",
  "/auth/callback/github",
  "/auth/refresh",
  "/auth/login",
  "/auth/signup",
  "/auth/verify",
]

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,

  withCredentials: true,
});


api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (excludePaths.some((path) => config.url?.includes(path))) return config;
    const token = access_token;
    // attach access token automatically
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// REFRESH LOGIC
let isRefreshing = false;

let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

function processQueue(
  error: unknown,
  token: string | null = null
) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  failedQueue = [];
}

// RESPONSE INTERCEPTOR

api.interceptors.response.use(
  (response: AxiosResponse) => {
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

    // IF REFRESH ALREADY RUNNING

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization =
              `Bearer ${token}`;

            resolve(api(originalRequest));
          },

          reject: (err) => {
            reject(err);
          },
        });
      });
    }

    // START REFRESH
    isRefreshing = true;

    try {
      // refresh token cookie automatically sent
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`,
        {},
        {
          withCredentials: true,
        }
      );

      access_token = response.data.access_token;

      // update queued requests
      processQueue(null, access_token);

      // retry original request
      originalRequest.headers.Authorization =
        `Bearer ${access_token}`;

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