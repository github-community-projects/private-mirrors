'use client'

import { ReactNode, createContext, useContext } from 'react'

export type GitHubEnvironment = {
  serverUrl: string
  apiUrl: string
  graphQlUrl: string
}

const GitHubEnvironmentContext = createContext<GitHubEnvironment | undefined>(
  undefined,
)

export const GitHubEnvironmentProvider = ({
  children,
  value,
}: {
  children: ReactNode
  value: GitHubEnvironment
}) => {
  return (
    <GitHubEnvironmentContext.Provider value={value}>
      {children}
    </GitHubEnvironmentContext.Provider>
  )
}

export const useGitHubEnvironment = () => {
  const value = useContext(GitHubEnvironmentContext)
  if (!value) {
    throw new Error(
      'useGitHubEnvironment must be used within GitHubEnvironmentProvider',
    )
  }
  return value
}
