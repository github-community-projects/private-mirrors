import { AlertIcon, XIcon } from '@primer/octicons-react'
import { Flash, IconButton } from '@primer/react'
import sharedStyles from 'app/styles/shared.module.css'
import styles from './flash.module.css'

interface ErrorFlashProps {
  message: string
  closeFlash?: () => void
}

export const ErrorFlash = ({ message, closeFlash }: ErrorFlashProps) => {
  return (
    <Flash variant="danger">
      <div className={sharedStyles.flexRowCenter}>
        <AlertIcon />
        <div className={styles.message}>{message}</div>
        {closeFlash && (
          <div className={styles.dismiss}>
            <IconButton
              icon={XIcon}
              variant="invisible"
              aria-labelledby="dismiss error"
              onClick={closeFlash}
              size="small"
            />
          </div>
        )}
      </div>
    </Flash>
  )
}
