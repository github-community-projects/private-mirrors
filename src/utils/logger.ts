/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
    /"access[-._]?token":"[^"]+"/g,
    /"api[-._]?key":"[^"]+"/g,
    /"client[-._]?secret":"[^"]+"/g,
    /"cookie":"[^"]+"/g,
    /"password":"[^"]+"/g,
    /"refresh[-._]?token":"[^"]+"/g,
    /"secret":"[^"]+"/g,
    /"token":"[^"]+"/g,
    /(?<=:\/\/)([^:]+):([^@]+)(?=@)/g,
  ],
  overwrite: {
    transportJSON: (log) => {
      const logObjWithMeta = log as {
        [key: string]: any
        _meta?: Record<string, any>
      }

      const output: {
        meta?: Record<string, any>
        message?: string
        info?: Record<string, any>
        data?: Record<string, any>
      } = {}

      // set meta
      output.meta = logObjWithMeta._meta

      // set message if it's a string or set it as info
      if (
        Object.prototype.hasOwnProperty.call(logObjWithMeta, '0') &&
        typeof logObjWithMeta['0'] === 'string'
      ) {
        output.message = logObjWithMeta['0']
      } else {
        output.info = logObjWithMeta['0']
      }

      // set data
      if (Object.prototype.hasOwnProperty.call(logObjWithMeta, '1')) {
        output.data = logObjWithMeta['1']
      }

      console.log(output)
    },
  },
})

logger.getSubLogger({ name: 'default' }).info('Initialized logger')

// Redirect next logs to our logger >:(
console.warn = logger
  .getSubLogger({ name: 'console' })
  .warn.bind(logger.getSubLogger({ name: 'console' }))
// Currently set to warn because of warning issued by undici showing as error
console.error = logger
  .getSubLogger({ name: 'console' })
  .warn.bind(logger.getSubLogger({ name: 'console' }))
