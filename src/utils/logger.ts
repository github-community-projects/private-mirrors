import winston from 'winston'
import traverse from 'traverse'

const { align, combine, colorize, errors, json, printf, timestamp } =
  winston.format

const getLoggerLevel = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'debug'
  }

  if (process.env.NODE_ENV === 'test' || process.env.TEST_LOGGING === '1') {
    return 'debug'
  }

  return 'info'
}

const getLogFormat = () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test' ||
    process.env.TEST_LOGGING === '1'
  ) {
    return combine(
      colorize({ all: true }),
      errors({ stack: true }),
      timestamp({
        format: 'YYYY-MM-DD hh:mm:ss.SSS A',
      }),
      align(),
      printf((info) =>
        info.metadata
          ? `[${info.timestamp}] ${info.level}: ${info.message}\n${JSON.stringify(info.metadata, null, 2)}`
          : `[${info.timestamp}] ${info.level}: ${info.message}`,
      ),
    )
  }

  return combine(
    errors({ stack: true }),
    timestamp(),
    winston.format((info) => redact(info))(),
    json(),
  )
}

const sensitiveKeys = [
  /access[-._]?token/i,
  /cookie/i,
  /passw(or)?d/i,
  /^pw$/,
  /^pass$/i,
  /secret/i,
  /token/i,
  /api[-._]?key/i,
  /session[-._]?id/i,
  /(?<=:\/\/)([^:]+):([^@]+)(?=@)/g,
]

const isSensitiveKey = (keyStr: string | undefined) => {
  if (!keyStr) {
    return false
  }

  return sensitiveKeys.some((regex) => regex.test(keyStr))
}

const redactObject = (info: winston.Logform.TransformableInfo) => {
  traverse(info).forEach(function redactor() {
    if (this.key && isSensitiveKey(this.key)) {
      this.update('[REDACTED]')
    }
  })
}

const redact = (obj: winston.Logform.TransformableInfo) => {
  const copy = structuredClone(obj)
  redactObject(copy)

  console.log(copy)

  return copy
}

export const logger = winston.createLogger({
  level: getLoggerLevel(),
  format: getLogFormat(),
  transports: [new winston.transports.Console()],
})

logger.info('Initialized logger')

// Redirect next logs to our logger >:(
console.warn = logger.info.bind(logger)
console.error = logger.info.bind(logger)
