import { BaseStyles, Box, ThemeProvider } from '@primer/react'
import { StyledComponentsRegistry } from '../providers/registry-provider'
import { TrpcProvider } from '../providers/trpc-provider'
import { MainHeader } from './components/header/MainHeader'
import { AuthProvider } from './context/AuthProvider'
import { getServerSession } from 'next-auth'
import { nextAuthOptions } from './api/auth/lib/nextauth-options'

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(nextAuthOptions)

  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <ThemeProvider>
            <BaseStyles>
              <AuthProvider session={session}>
                <TrpcProvider>
                  <Box
                    sx={{
                      mx: 'auto',
                      width: '100%',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'sticky',
                        top: 0,
                        height: 64,
                        display: 'grid',
                      }}
                    >
                      <MainHeader />
                    </Box>
                    <Box sx={{ padding: '40px', margin: '10px 90px' }}>
                      {children}
                    </Box>
                  </Box>
                </TrpcProvider>
              </AuthProvider>
            </BaseStyles>
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}

export default RootLayout
