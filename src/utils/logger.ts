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

const formatMeta = (meta: any) => {
  // You can format the splat yourself
  const splat = meta[Symbol.for('splat')]
  if (splat && splat.length) {
    return splat.length === 1
      ? `\n${JSON.stringify(splat[0], null, 2)}`
      : `\n${JSON.stringify(splat, null, 2)}`
  }
  return ''
}

const formatStack = (stack: any) => {
  return stack ? `\n${stack}` : ''
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

const redact = (info: winston.Logform.TransformableInfo) => {
  const copy = structuredClone(info)

  redactObject(copy)

  return copy
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
      printf(
        ({ timestamp, level, name, message, stack, ...meta }) =>
          `[${timestamp}] - ${level} [${name}] ${message} ${formatMeta(meta)} ${formatStack(stack)}`,
      ),
    )
  }

  return combine(
    errors({ stack: true }),
    timestamp(),
    // winston.format((info) => redact(info))(),
    json(),
  )
}

export const logger = winston.createLogger({
  level: getLoggerLevel(),
  format: getLogFormat(),
  transports: [new winston.transports.Console()],
})

logger.child({ name: 'default' }).info('Initialized logger')

// Redirect next logs to our logger >:(
console.warn = logger.child({ name: console }).info.bind(logger)
console.error = logger.child({ name: console }).info.bind(logger)
