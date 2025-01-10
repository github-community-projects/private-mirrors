import { Octokit } from '@octokit/rest';
import { Context as ProbotContext } from 'probot';
import { Context as LambdaContext } from 'aws-lambda';
import { GitHubCheck } from './GitHubCheck';

/**
 * A check that should be sent to the default branch of the repository.
 */
export class DefaultCheck extends GitHubCheck {
  public static async fromContexts(probotContext: ProbotContext, lambdaContext?: LambdaContext) {
    const { data: repo } = await probotContext.octokit.rest.repos.get(probotContext.repo());
    const { data: head } = await probotContext.octokit.rest.git.getRef({
      ...probotContext.repo(),
      ref: `heads/${repo.default_branch}`
    });

    const context = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      octokit: probotContext.octokit as unknown as Octokit,
      getRemainingTimeInMillis: lambdaContext?.getRemainingTimeInMillis
        ? () => lambdaContext.getRemainingTimeInMillis()
        : undefined
    };

    return new DefaultCheck(
      {
        ...probotContext.repo(),
        name: 'Default Branch',
        head_sha: head.object.sha,
        output: {
          title: 'Default Branch',
          summary: '',
          text: [
            'This check exists in case creation of other branches has failed',
            'To retry attaching this repository to an upstream repository, click the `resync` button'
          ].join('\n')
        },
        actions: [
          {
            label: 'Resync',
            description: 'Resync the root branch',
            identifier: 'resync'
          }
        ]
      },
      context
    );
  }
}

/**
 * A check that should be sent to the root branch of the repository.
 *
 * It should allow for resyncing the root branch.
 */
export class RootCheck extends GitHubCheck {
  // eslint-disable-next-line @typescript-eslint/require-await
  public static async fromContexts(probotContext: ProbotContext<'push'>, lambdaContext?: LambdaContext) {
    const context = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      octokit: probotContext.octokit as unknown as Octokit,
      getRemainingTimeInMillis: lambdaContext?.getRemainingTimeInMillis
        ? () => lambdaContext.getRemainingTimeInMillis()
        : undefined
    };

    return new RootCheck(
      {
        ...probotContext.repo(),
        name: 'Root Branch',
        head_sha: probotContext.payload.after,
        output: {
          title: 'Root Branch',
          summary: [
            '## Root Repository',
            'The `upstream` repository could be a fork of another repository (which may itself be a fork).',
            'In this case, contributions to the `upstream` repository are likely intended to be contributions to some repository in its network of forks (the `root` repository).',
            '',
            'If the `upstream` repository is NOT a fork, then the `root` repository is the same as the `upstream` repository.',

            '## Root Branch',
            'The `root` branch follows the default branch of the `root` repository. This provides:',
            '1. A starting point for upstream branches.',
            '2. A convenient point to branch from when making new feature branches.',
            '3. A good choice of default branch for the `downstream` repository.',
            '',
            '## Resyncing',
            'To resync the `root` branch with the default branch of the `root` repository, click the `resync` button'
          ].join('\n')
        },
        actions: [
          {
            label: 'Resync',
            description: 'Resync the root branch',
            identifier: 'resync'
          }
        ]
      },
      context
    );
  }
}

/**
 * A check that should be sent to feature branches of the repository.
 *
 * It should give status for creating upstream branches.
 */
export class FeatureCheck extends GitHubCheck {
  // eslint-disable-next-line @typescript-eslint/require-await
  public static async fromContexts(
    probotContext: ProbotContext<'push'>,
    lambdaContext?: LambdaContext
  ): Promise<FeatureCheck> {
    const context = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      octokit: probotContext.octokit as unknown as Octokit,
      getRemainingTimeInMillis: lambdaContext?.getRemainingTimeInMillis
        ? () => lambdaContext.getRemainingTimeInMillis()
        : undefined
    };

    return new FeatureCheck(
      {
        ...probotContext.repo(),
        name: 'Feature Branch',
        head_sha: probotContext.payload.after,
        output: {
          title: 'Feature Branch',
          summary: [
            'The feature branches represent internal development on the `downstream` repository.',
            'Contents of these branches are not directly reflected on the `upstream` repository.',
            'This check ensures that an `upstream/` branch is created for the feature branch.'
          ].join('\n')
        }
      },
      context
    );
  }
}

/**
 * A check that should be sent to upstream branches of the repository.
 *
 * It should give status for mirroring changes to the upstream repository.
 */
export class UpstreamCheck extends GitHubCheck {
  // eslint-disable-next-line @typescript-eslint/require-await
  public static async fromContexts(
    probotContext: ProbotContext<'push'>,
    lambdaContext?: LambdaContext
  ): Promise<UpstreamCheck> {
    const context = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      octokit: probotContext.octokit as unknown as Octokit,
      getRemainingTimeInMillis: lambdaContext?.getRemainingTimeInMillis
        ? () => lambdaContext.getRemainingTimeInMillis()
        : undefined
    };

    return new UpstreamCheck(
      {
        ...probotContext.repo(),
        head_sha: probotContext.payload.after,
        name: 'Upstream Branch',
        output: {
          title: 'Upstream Branch',
          summary: [
            'An `upstream/` branch is created whenever a `feature/` branch is created.',
            'It is initialised to the current HEAD of the `root` branch.',
            'This check ensures that changes to `upstream/` branches get mirrored in the upstream repository.'
          ].join('\n')
        }
      },
      context
    );
  }
}
