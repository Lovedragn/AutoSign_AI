// Centralized environment configuration loader for Frontend

export const GOOGLE_CLIENT_ID =
  import.meta.env.GOOGLE_CLIENT_ID ||
  "";

export const API_BASE_URL =
  import.meta.env.API_BASE_URL ||
  "http://localhost:5000";

export const ENV = import.meta.env.ENV || "development";
