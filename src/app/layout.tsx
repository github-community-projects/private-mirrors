import { BaseStyles, Box, ThemeProvider } from '@primer/react'
import { TrpcProvider } from '../utils/trpc-provider'
import AuthProvider from './context/AuthProvider'
import MainHeader from './components/header/MainHeader'
import StyledComponentsRegistry from '../lib/registry'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <ThemeProvider>
            <BaseStyles>
              <AuthProvider>
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
                    <Box sx={{ padding: '40px' }}>{children}</Box>
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
