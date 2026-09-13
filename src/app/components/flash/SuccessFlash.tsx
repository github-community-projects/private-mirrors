import { CheckIcon, XIcon } from '@primer/octicons-react'
import { Flash, IconButton, Link } from '@primer/react'
import sharedStyles from 'app/styles/shared.module.css'
import styles from './flash.module.css'

interface SuccessFlashProps {
  message: string
  mirrorUrl: string
  orgLogin: string
  mirrorName: string
  closeFlash: () => void
}

export const SuccessFlash = ({
  message,
  mirrorUrl,
  orgLogin,
  mirrorName,
  closeFlash,
}: SuccessFlashProps) => {
  return (
    <Flash variant="success">
      <div className={sharedStyles.flexRowCenter}>
        <CheckIcon />
        <div className={styles.message}>
          {message}{' '}
          <Link href={mirrorUrl} target="_blank" rel="noreferrer noopener">
            {orgLogin}/{mirrorName}
          </Link>
          .
        </div>
        <div className={styles.dismiss}>
          <IconButton
            icon={XIcon}
            variant="invisible"
            aria-labelledby="dismiss create success"
            onClick={closeFlash}
            size="small"
          />
        </div>
      </div>
    </Flash>
  )
}
