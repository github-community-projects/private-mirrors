/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from 'tslog'

// If you need logs during tests you can set the env var TEST_LOGGING=true
const getLoggerType = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'pretty'
  }

  if (process.env.NODE_ENV === 'test' || process.env.TEST_LOGGING === '1') {
    return 'pretty'
  }

  return 'json'
}

export const logger = new Logger({
  type: getLoggerType(),
  maskValuesRegEx: [
    /"access_token":"[^"]+"/g,
    /(?<=:\/\/)([^:]+):([^@]+)(?=@)/g,
  ],
  overwrite: {
    transportJSON: (log) => {
      let logObjWithMeta = log as {
        _meta?: Record<string, any>
        meta?: Record<string, any>
        message?: string
        data?: Record<string, any>
        [key: string]: any
      }

      const meta = logObjWithMeta._meta

      delete logObjWithMeta._meta

      // If the log is only a string, then set "message"
      if (
        Object.prototype.hasOwnProperty.call(logObjWithMeta, '0') &&
        typeof logObjWithMeta['0'] === 'string'
      ) {
        const message = logObjWithMeta['0']
        delete logObjWithMeta['0']
        logObjWithMeta = {
          message,
          data: logObjWithMeta,
          meta,
        }
      } else {
        logObjWithMeta = {
          data: logObjWithMeta,
          meta,
        }
      }

      if (Object.keys(logObjWithMeta.data ?? {}).length === 0) {
        delete logObjWithMeta.data
      }

      const output = JSON.stringify(logObjWithMeta)

      console.log(output)
    },
  },
})

logger.info('Initialized logger')

// Redirect next logs to our logger >:(
console.warn = logger.info.bind(logger)
console.error = logger.info.bind(logger)
