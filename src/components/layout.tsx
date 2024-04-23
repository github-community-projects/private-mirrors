import { Box, PageLayout } from '@primer/react'
import type { ReactNode } from 'react'
import MainHeader from './header'

export default function Layout({ children }: { children: ReactNode }) {
  return (
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
      <PageLayout sx={{ height: '100%', width: '100%' }}>
        <PageLayout.Content sx={{ width: '100%' }}>
          {children}
        </PageLayout.Content>
      </PageLayout>
    </Box>
  )
}
