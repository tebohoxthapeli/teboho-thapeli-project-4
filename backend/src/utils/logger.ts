import * as winston from "winston";

type Level = "info" | "warn" | "error" | "debug";

export function createLogger(loggerName: string) {
  return winston.createLogger({
    level: "info",
    format: winston.format.json(),
    defaultMeta: { name: loggerName },
    transports: [new winston.transports.Console()],
  });
}

export function log(
  logger: winston.Logger,
  level: Level,
  initialMessage: string,
  attachedValue: any = {}
) {
  attachedValue = JSON.stringify(attachedValue);
  const finalMessage = [initialMessage, attachedValue].join(" : ");
  logger[level](finalMessage);
}
