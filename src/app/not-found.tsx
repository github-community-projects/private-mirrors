'use client'

import { AlertIcon } from '@primer/octicons-react'
import { Blankslate } from '@primer/react/experimental'
import sharedStyles from 'app/styles/shared.module.css'
import styles from './not-found.module.css'

const NotFoundPage = () => {
  return (
    <div className={styles.wrapper}>
      <Blankslate>
        <div className={sharedStyles.blankslateIconPad}>
          <Blankslate.Visual>
            <AlertIcon size={24} className={sharedStyles.mutedIcon} />
          </Blankslate.Visual>
        </div>
        <Blankslate.Heading>Page not found</Blankslate.Heading>
        <Blankslate.Description>
          This is not the page you&apos;re looking for.
        </Blankslate.Description>
        <div className={styles.actionPad}>
          <Blankslate.SecondaryAction href="/">
            Back to home
          </Blankslate.SecondaryAction>
        </div>
      </Blankslate>
    </div>
  )
}

export default NotFoundPage
