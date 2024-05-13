import { Box, Breadcrumbs } from '@primer/react'
import { useForkData } from 'utils/fork'
import { useOrgData } from 'utils/organization'

export default function ForkBreadcrumbs() {
  const orgData = useOrgData()
  const forkData = useForkData()

  return (
    <Box>
      <Breadcrumbs sx={{ marginBottom: '10px' }}>
        <Breadcrumbs.Item
          href={`/${orgData?.login}`}
          sx={{ fontSize: '2', fontWeight: 'bold' }}
        >
          All Forks
        </Breadcrumbs.Item>
        <Breadcrumbs.Item selected sx={{ fontSize: '2', fontWeight: 'bold' }}>
          {forkData?.name}
        </Breadcrumbs.Item>
      </Breadcrumbs>
    </Box>
  )
}
