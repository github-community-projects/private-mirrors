import { Breadcrumbs } from '@primer/react'
import { OrgData } from 'hooks/useOrganization'
import sharedStyles from 'app/styles/shared.module.css'
import styles from './breadcrumbs.module.css'

interface ForkBreadcrumbsProps {
  orgData: OrgData
}

export const OrgBreadcrumbs = ({ orgData }: ForkBreadcrumbsProps) => {
  if (!orgData) {
    return null
  }

  return (
    <div className={sharedStyles.stackMarginBottom}>
      <Breadcrumbs className={styles.wrapper}>
        <Breadcrumbs.Item href="/" className={styles.item}>
          All organizations
        </Breadcrumbs.Item>
        <Breadcrumbs.Item selected className={styles.item}>
          {orgData?.login}
        </Breadcrumbs.Item>
      </Breadcrumbs>
    </div>
  )
}
