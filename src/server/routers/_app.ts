import { router } from "../trpc";
import { gitRouter } from "./git";
import { octokitRouter } from "./octokit";

export const appRouter = router({
  git: gitRouter,
  octokit: octokitRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
