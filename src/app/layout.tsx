import { BaseStyles, ThemeProvider } from '@primer/react'
import { StyledComponentsRegistry } from '../providers/registry-provider'
import { TrpcProvider } from '../providers/trpc-provider'
import { MainHeader } from './components/header/MainHeader'
import { AuthProvider } from './context/AuthProvider'
import { getServerSession } from 'next-auth'
import { nextAuthOptions } from './api/auth/lib/nextauth-options'
import { env } from '../../env.mjs'
import { GitHubEnvironmentProvider } from './context/GitHubEnvironmentProvider'
import styles from './layout.module.css'

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(nextAuthOptions)

  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <ThemeProvider>
            <BaseStyles>
              <GitHubEnvironmentProvider
                value={{
                  serverUrl: env.GITHUB_SERVER_URL,
                  apiUrl: env.GITHUB_API_URL,
                  graphQlUrl: env.GITHUB_GRAPHQL_URL,
                }}
              >
                <AuthProvider session={session}>
                  <TrpcProvider>
                    <div className={styles.container}>
                      <div className={styles.stickyHeader}>
                        <MainHeader />
                      </div>
                      <div className={styles.content}>{children}</div>
                    </div>
                  </TrpcProvider>
                </AuthProvider>
              </GitHubEnvironmentProvider>
            </BaseStyles>
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}

export default RootLayout
