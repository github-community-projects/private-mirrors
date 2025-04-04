import { z } from 'zod'

// this type is generated from the graphql query to support
// the requirements of the primer datatable component
const ForksObject = z.object({
  organization: z.object({
    repositories: z.object({
      totalCount: z.number(),
      nodes: z.array(
        z.object({
          databaseId: z.number(),
          name: z.string(),
          isPrivate: z.boolean(),
          updatedAt: z.date(),
          owner: z.object({
            avatarUrl: z.string(),
            login: z.string(),
          }),
          parent: z.object({
            name: z.string(),
            owner: z.object({
              login: z.string(),
              avatarUrl: z.string(),
            }),
          }),
          languages: z.object({
            nodes: z.array(
              z.object({
                name: z.string(),
                color: z.string(),
              }),
            ),
          }),
          refs: z.object({
            totalCount: z.number(),
          }),
        }),
      ),
    }),
  }),
})

export type ForksObject = z.infer<typeof ForksObject>
