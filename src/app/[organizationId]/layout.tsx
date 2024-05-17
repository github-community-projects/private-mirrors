'use client'

import { Box } from '@primer/react'
import { OrgHeader } from 'app/components/header/OrgHeader'
import { useOrgData } from 'utils/organization'

const DashLayout = ({ children }: { children: React.ReactNode }) => {
  const orgData = useOrgData()

  return (
    <Box sx={{ margin: '10px 90px' }}>
      <Box>
        <OrgHeader orgData={orgData} />
      </Box>
      <Box>{children}</Box>
    </Box>
  )
}

export default DashLayout
