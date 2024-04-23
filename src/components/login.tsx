import { MarkGithubIcon } from '@primer/octicons-react'
import { Box, Button, Octicon, Text } from '@primer/react'
import { signIn, useSession } from 'next-auth/react'

export default function LoginBox() {
  const { data: session } = useSession()

  return (
    <Box
      sx={{
        width: 'fit-content',
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
      }}
    >
      <Box sx={{ margin: '40px 175px 20px 175px' }}>
        <Octicon icon={MarkGithubIcon} color="fg.default" size={48}></Octicon>
      </Box>
      {!session && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: '0 0 40px 0',
          }}
        >
          <Box sx={{ margin: '0 0 15px 0' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Text sx={{ fontSize: '3' }}>Sign in to get started</Text>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Text sx={{ fontSize: '1', color: 'fg.muted' }}>
                Internal Contribution Forks
              </Text>
            </Box>
          </Box>
          <Box>
            <Button
              variant="primary"
              onClick={() => {
                signIn()
              }}
            >
              Sign in with GitHub
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}
