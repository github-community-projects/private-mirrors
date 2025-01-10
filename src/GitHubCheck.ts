import { Octokit } from '@octokit/rest';
import defaults from 'defaults';
import { PartialDeep } from 'type-fest';
import { setTimeout } from 'node:timers/promises';

type CheckFn = Octokit['checks']['create'];
type CheckParams = NonNullable<Parameters<CheckFn>[0]>;
type CheckReturn = ReturnType<CheckFn>;
type PartialCheckParams = PartialDeep<CheckParams, { recurseIntoArrays: true }>;

interface Context {
  octokit: Octokit;
  getRemainingTimeInMillis?: () => number;
}

export class GitHubCheck {
  private params: PartialCheckParams;

  private context: Context;

  constructor(params: PartialCheckParams, context: Context) {
    this.params = params;
    this.context = context;
  }

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  async with<R>(fn: () => Promise<R>): Promise<void | R> {
    const wrapper = async () => {
      try {
        const result = await fn();
        await this.sendSuccess();
        return result;
      } catch (error) {
        await this.sendError(error);
        throw error;
      }
    };

    await this.send({ status: 'in_progress' });
    return Promise.race([wrapper(), this.hookTimeout()]);
  }

  async send(overrides: PartialCheckParams): CheckReturn {
    console.log('Sending check:', JSON.stringify(defaults(overrides, this.params), null, 2));
    return this.context.octokit.checks.create(defaults(overrides, this.params) as CheckParams);
  }

  async sendSuccess(): CheckReturn {
    return this.send({ status: 'completed', conclusion: 'success' });
  }

  async sendError(error: unknown): CheckReturn {
    return this.send({
      status: 'completed',
      conclusion: 'failure',
      output: {
        text: [this.params.output?.text, error].filter(x => x !== undefined).join('\n\n')
      }
    });
  }

  private async hookTimeout() {
    if (!this.context.getRemainingTimeInMillis) return;

    // Schedule a warning 5 seconds before the function times out
    const timeoutWarning = this.context.getRemainingTimeInMillis() - 5000;

    await setTimeout(timeoutWarning);

    const remainingTime = this.context.getRemainingTimeInMillis();
    await this.send({
      status: 'completed',
      conclusion: 'timed_out',
      output: {
        text: [this.params.output?.text, `The check will be timing out in ${remainingTime}ms`]
          .filter(x => x !== undefined)
          .join('\n\n')
      }
    });
  }
}
