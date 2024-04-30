import { Box } from '@primer/react'
import OrgHeader from 'app/components/OrgHeader'

export default function DashLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box sx={{ margin: '10px 90px' }}>
      <Box>
        <OrgHeader />
      </Box>
      <Box>{children}</Box>
    </Box>
  )
}
