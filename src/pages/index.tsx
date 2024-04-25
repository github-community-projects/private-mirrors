import { Box } from '@primer/react'
import { personalOctokit } from 'bot/octokit'
import LoginBox from 'components/login'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

function HomePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [organizations, setOrganizations] = useState<
    Awaited<ReturnType<typeof getAllOrganizations>>
  >([])

  const getAllOrganizations = async (accessToken: string) => {
    const octokit = personalOctokit(accessToken)
    const data = await octokit.rest.orgs.listForAuthenticatedUser()
    return data.data
  }

  useEffect(() => {
    if (session?.user) {
      // TODO: Make this type work
      const { accessToken } = (session?.user as any) ?? {}
      if (!accessToken) {
        return
      }

      getAllOrganizations(accessToken).then((orgs) => {
        router.push(`/${orgs[0].login}`)

        setOrganizations(orgs)
      })
    }
  }, [session, router, session?.user])

  return <Box>{!session && <LoginBox />}</Box>
}

export default HomePage
