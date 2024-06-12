'use client'

import { MarkGithubIcon } from '@primer/octicons-react'
import { Box, Button, Octicon, Text } from '@primer/react'
import { useRouter } from 'next/navigation'

const ErrorPage = () => {
  const router = useRouter()

  return (
    <Box
      sx={{
        width: '394px',
        height: 'auto',
        top: '160px',
        margin: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'border.default',
        borderRadius: '12px',
        padding: '40px',
        marginTop: '60px',
      }}
    >
      <Box sx={{ marginBottom: '15px' }}>
        <Octicon icon={MarkGithubIcon} color="fg.default" size={48}></Octicon>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box>
          <Box sx={{ textAlign: 'center' }}>
            <Text sx={{ fontSize: '3' }}>Access denied</Text>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Text sx={{ fontSize: '1', color: 'fg.muted' }}>
              Reach out to your organization admin to get access
            </Text>
          </Box>
        </Box>
        <Box sx={{ marginTop: '15px' }}>
          <Button
            onClick={() => {
              router.push('/')
            }}
          >
            Back to sign in
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default ErrorPage
