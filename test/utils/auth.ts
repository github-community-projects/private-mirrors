import { Session } from '../../src/types/next-auth'
import { createContext } from '../../src/utils/trpc-server'

export const createTestContext = (
  session?: Session,
): Awaited<ReturnType<typeof createContext>> => {
  return {
    session: session ?? {
      user: {
        name: 'fake-username',
        email: 'fake-email',
        image: 'fake-image',
        accessToken: 'fake-access-token',
      },
      expires: new Date('2030-01-01').toISOString(),
    },
  }
}
