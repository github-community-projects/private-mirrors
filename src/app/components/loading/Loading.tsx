import { Spinner, Stack } from '@primer/react'
import styles from './Loading.module.css'

interface LoadingProps {
  message: string
}

export const Loading = ({ message }: LoadingProps) => {
  return (
    <div className={styles.wrapper}>
      <Stack direction="horizontal" align="center">
        <Stack.Item>
          <Spinner className={styles.spinner} />
        </Stack.Item>
        <Stack.Item>{message}</Stack.Item>
      </Stack>
    </div>
  )
}
