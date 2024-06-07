import { Box, Breadcrumbs } from '@primer/react'
import { OrgData } from 'hooks/useOrganization'

interface ForkBreadcrumbsProps {
  orgData: OrgData
}

export const OrgBreadcrumbs = ({ orgData }: ForkBreadcrumbsProps) => {
  if (!orgData) {
    return null
  }

  return (
    <Box sx={{ marginBottom: '10px' }}>
      <Breadcrumbs sx={{ display: 'inline-block', paddingRight: '10px' }}>
        <Breadcrumbs.Item href="/" sx={{ fontSize: '2', fontWeight: 'bold' }}>
          All organizations
        </Breadcrumbs.Item>
        <Breadcrumbs.Item selected sx={{ fontSize: '2', fontWeight: 'bold' }}>
          {orgData?.login}
        </Breadcrumbs.Item>
      </Breadcrumbs>
    </Box>
  )
}
