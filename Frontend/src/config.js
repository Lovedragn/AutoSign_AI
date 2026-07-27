// Centralized environment configuration loader for Frontend

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "2303819397-aecv3fh0n6rk3ktc1efrsqs2rut49vdf.apps.googleusercontent.com";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:5000";

export const ENV = import.meta.env.VITE_ENV || "development";
