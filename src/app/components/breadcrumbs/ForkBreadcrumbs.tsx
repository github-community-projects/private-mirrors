import { Breadcrumbs } from '@primer/react'
import { ForkData } from 'hooks/useFork'
import { OrgData } from 'hooks/useOrganization'
import sharedStyles from 'app/styles/shared.module.css'
import styles from './breadcrumbs.module.css'

interface ForkBreadcrumbsProps {
  orgData: OrgData
  forkData: ForkData
}

export const ForkBreadcrumbs = ({
  orgData,
  forkData,
}: ForkBreadcrumbsProps) => {
  if (!orgData || !forkData) {
    return null
  }

  return (
    <div className={sharedStyles.stackMarginBottom}>
      <Breadcrumbs className={styles.wrapper}>
        <Breadcrumbs.Item href="/" className={styles.item}>
          All organizations
        </Breadcrumbs.Item>
        <Breadcrumbs.Item href={`/${orgData?.login}`} className={styles.item}>
          {orgData?.login}
        </Breadcrumbs.Item>
        <Breadcrumbs.Item selected className={styles.item}>
          {forkData?.name}
        </Breadcrumbs.Item>
      </Breadcrumbs>
    </div>
  )
}
