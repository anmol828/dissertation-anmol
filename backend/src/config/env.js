import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_TOKEN_SECRET || "access-secret",
    refreshSecret: process.env.JWT_REFRESH_TOKEN_SECRET || "refresh-secret",
    accessExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "7d"
  },
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173"
};

