import { ClockIcon, XIcon } from '@primer/octicons-react'
import { Flash, IconButton, Link } from '@primer/react'
import sharedStyles from 'app/styles/shared.module.css'
import styles from './flash.module.css'

interface PendingFlashProps {
  mirrorUrl: string
  orgLogin: string
  mirrorName: string
  closeFlash: () => void
}

export const PendingFlash = ({
  mirrorUrl,
  orgLogin,
  mirrorName,
  closeFlash,
}: PendingFlashProps) => {
  return (
    <Flash variant="warning">
      <div className={sharedStyles.flexRowCenter}>
        <ClockIcon />
        <div className={styles.message}>
          Mirror creation is taking longer than expected and will continue in
          the background. Your new private mirror{' '}
          <Link href={mirrorUrl} target="_blank" rel="noreferrer noopener">
            {orgLogin}/{mirrorName}
          </Link>{' '}
          may take some time to be fully populated with commits.
        </div>
        <div className={styles.dismiss}>
          <IconButton
            icon={XIcon}
            variant="invisible"
            aria-labelledby="dismiss create pending"
            onClick={closeFlash}
            size="small"
          />
        </div>
      </div>
    </Flash>
  )
}
