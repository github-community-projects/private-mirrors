import { Logger } from 'tslog'

// If you need logs during tests you can set the env var TEST_LOGGING=true
const getLoggerType = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'pretty'
  }

  if (process.env.NODE_ENV === 'test' && !process.env.TEST_LOGGING) {
    return 'hidden'
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
    transportJSON: (logObjWithMeta: any) => {
      const meta = logObjWithMeta._meta

      delete logObjWithMeta._meta

      // If the log is only a string, then set "message"
      if (
        logObjWithMeta.hasOwnProperty('0') &&
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

      if (Object.keys(logObjWithMeta.data).length === 0) {
        delete logObjWithMeta.data
      }

      const output = JSON.stringify(logObjWithMeta)

      if (meta?.logLevelName === 'ERROR' || meta?.logLevelName === 'FATAL') {
        console.error(output)
      } else if (meta?.logLevelName === 'WARN') {
        console.warn(output)
      } else {
        console.log(output)
      }
    },
  },
})

logger.info('Initialized logger')
