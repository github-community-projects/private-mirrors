import { MarkGithubIcon } from '@primer/octicons-react'
import { Box, Button, Octicon, Text } from '@primer/react'
import { signIn } from 'next-auth/react'

const signInWithGitHub = async () => {
  await signIn('github')
}

export const Login = () => {
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
        <Box sx={{ marginBottom: '15px' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Text sx={{ fontSize: '3' }}>Sign in to get started.</Text>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Text sx={{ fontSize: '1', color: 'fg.muted' }}>
              Private Mirrors
            </Text>
          </Box>
        </Box>
        <Box>
          <Button
            variant="primary"
            onClick={async () => {
              await signInWithGitHub()
            }}
          >
            Sign in with GitHub
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
