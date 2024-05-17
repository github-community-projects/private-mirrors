'use client'

import { AlertIcon } from '@primer/octicons-react'
import { Box, Octicon } from '@primer/react'
import Blankslate from '@primer/react/lib-esm/Blankslate/Blankslate'

const NotFoundPage = () => {
  return (
    <Box
      sx={{
        padding: '40px',
      }}
    >
      <Blankslate>
        <Box sx={{ padding: '10px' }}>
          <Blankslate.Visual>
            <Octicon icon={AlertIcon} size={24} color="fg.muted"></Octicon>
          </Blankslate.Visual>
        </Box>
        <Blankslate.Heading>Page not found</Blankslate.Heading>
        <Blankslate.Description>
          This is not the page you&apos;re looking for.
        </Blankslate.Description>
        <Box sx={{ padding: '20px' }}>
          <Blankslate.SecondaryAction href="/">
            Back to repositories
          </Blankslate.SecondaryAction>
        </Box>
      </Blankslate>
    </Box>
  )
}

export default NotFoundPage
