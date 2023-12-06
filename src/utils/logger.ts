import { Logger } from "tslog";

// If you need logs during tests you can set the env var TEST_LOGGING=true
const getLoggerType = () => {
  if (process.env.NODE_ENV === "development") {
    return "pretty";
  }

  if (process.env.NODE_ENV === "test" && !process.env.TEST_LOGGING) {
    return "hidden";
  }

  return "json";
};

export const logger = new Logger({
  type: getLoggerType(),
  maskValuesRegEx: [
    /"access_token":"[^"]+"/g,
    /(?<=:\/\/)([^:]+):([^@]+)(?=@)/g,
  ],
});
logger.info("Initialized logger");
