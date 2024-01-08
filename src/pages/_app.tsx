import { BaseStyles, ThemeProvider } from '@primer/react'
import Layout from 'components/layout'
import { DefaultSession } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import type { AppType } from 'next/app'
import { trpc } from '../utils/trpc'

interface Session extends DefaultSession {
  user: {
    accessToken: string
  } & DefaultSession['user']
}

const MyApp: AppType<{ session: Session }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  // next bug where Component is not a ReactElement
  const NextComponent = Component as any

  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <BaseStyles>
          <Layout>
            <NextComponent {...pageProps} session={session} />
          </Layout>
        </BaseStyles>
      </ThemeProvider>
    </SessionProvider>
  )
}

export default trpc.withTRPC(MyApp)
