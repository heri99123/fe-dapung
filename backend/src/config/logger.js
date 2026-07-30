import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
  level: "info",
});

export default logger;
