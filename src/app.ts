import { Probot, ProbotOctokit, Context, ApplicationFunctionOptions } from 'probot';
import { Context as LambdaContext } from 'aws-lambda';
import { Octokit } from 'octokit';
import { dir } from 'tmp-promise';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node/index.js';
import fs from 'node:fs';
import { DefaultCheck, FeatureCheck, RootCheck, UpstreamCheck } from './checks';

const UPSTREAM_PROPERTY_NAME = 'upstream-repository';
const ROOT_PROPERTY_NAME = 'root-repository';

interface LambdaApplicationFunctionOptions extends ApplicationFunctionOptions {
  context?: LambdaContext;
}

export default function bot(app: Probot, options: LambdaApplicationFunctionOptions) {
  app.on('custom_property_values.updated', async context => {
    const oldUpstreamProp =
      context.payload.old_property_values.find(e => e.property_name === UPSTREAM_PROPERTY_NAME)?.value ?? undefined;
    const newUpstreamProp =
      context.payload.new_property_values.find(e => e.property_name === UPSTREAM_PROPERTY_NAME)?.value ?? undefined;
    const changedUpstreamProp = oldUpstreamProp !== newUpstreamProp;
    if (changedUpstreamProp) context.log.info(`The ${UPSTREAM_PROPERTY_NAME} property has been updated.`);

    const oldRootProp =
      context.payload.old_property_values.find(e => e.property_name === ROOT_PROPERTY_NAME)?.value ?? undefined;
    const newRootProp =
      context.payload.new_property_values.find(e => e.property_name === ROOT_PROPERTY_NAME)?.value ?? undefined;
    const changedRootProp = oldRootProp !== newRootProp;
    if (changedRootProp) context.log.info(`The ${ROOT_PROPERTY_NAME} property has been updated.`);

    if (changedUpstreamProp || changedRootProp) {
      const defaultCheck = await DefaultCheck.fromContexts(context, options.context);

      await defaultCheck.with(async () => {
        // If the upstream property has changed, we need to detach the repository from the old upstream.
        if (oldUpstreamProp) await detachUpstream(oldUpstreamProp, context);
        // Unless the upstream prop has been removed, we need to (re-)attach the repository to the new upstream.
        if (Boolean(newUpstreamProp) || changedRootProp) await attachUpstream(context);
      });
    }
  });

  app.on('push', async context => {
    context.log.trace(JSON.stringify(context.payload, null, 2));

    if (!context.payload.repository.custom_properties[UPSTREAM_PROPERTY_NAME]) {
      context.log.debug(`Ignoring push for repository without ${UPSTREAM_PROPERTY_NAME} property.`);
      return;
    }

    const defaultCheck = await DefaultCheck.fromContexts(context, options.context);
    await defaultCheck.with(async () => {
      // Pushes can either be...
      if (context.payload.ref === 'refs/heads/root') {
        // ...updating the root branch...

        // ...in which case we make the root check float to the HEAD of the root branch
        const check = await RootCheck.fromContexts(context, options.context);
        await check.sendSuccess();
      } else if (context.payload.ref.startsWith('refs/heads/feature/')) {
        // ...or updating a feature/ branch...

        // ...in which case we ensure an upstream/ branch exists.
        const check = await FeatureCheck.fromContexts(context, options.context);
        await check.with(async () => ensureUpstreamBranch(context));
      } else if (context.payload.ref.startsWith('refs/heads/upstream/')) {
        // ...updating an upstream branch...

        // ...in which case we push the changes to the upstream repository
        const check = await UpstreamCheck.fromContexts(context, options.context);
        await check.with(async () => pushToUpstream(context));
      }
    });
  });

  /**
   * When a resync is requested, we reattach the repository to the upstream repository.
   */
  app.on(['check_run.requested_action'], async context => {
    // Don't run if the repository does not have an upstream property.
    if (!context.payload.repository.custom_properties[UPSTREAM_PROPERTY_NAME]) return;

    // Don't run if the request is not for our app.
    const { data: app } = await context.octokit.apps.getAuthenticated();
    if (context.payload.check_run.app.id !== app.id) return;

    const defaultCheck = await DefaultCheck.fromContexts(context, options.context);
    await defaultCheck.with(async () => {
      if (context.payload.requested_action.identifier === 'resync') await attachUpstream(context);
    });
  });
}

/**
 * This function should be idempotent.
 * It should ensure the repository is well connected to the upstream repository, and up-to-date with source.
 */
async function attachUpstream(
  context: Context<'custom_property_values.updated' | 'check_run.requested_action'>
): Promise<void> {
  context.log.info({ ...context.repo(), msg: 'Disabling dependabot security fixes' });
  try {
    await context.octokit.repos.disableAutomatedSecurityFixes(context.repo());
  } catch (e) {
    context.log.warn({
      ...context.repo(),
      msg: 'Failed to disable automated security fixes. Ignoring and continuing.',
      error: e
    });
    // A failure to disable here is tolerable.
  }

  context.log.info({ ...context.repo(), msg: 'Disabling GitHub Actions' });
  await context.octokit.actions.setGithubActionsPermissionsRepository({ ...context.repo(), enabled: false });

  const repoDir = await cloneRepository(context);

  context.log.info({
    ...context.repo(),
    msg: "Fetching the root repository's default branch."
  });
  await git.fetch({
    fs,
    dir: repoDir,
    http,
    remote: 'root',
    ref: 'refs/remotes/root/HEAD',
    remoteRef: 'HEAD',
    singleBranch: true
  });

  context.log.info({
    ...context.repo(),
    msg: "Force-pushing the root repository's default branch to the downstream repository's root branch."
  });
  await git.push({
    fs,
    dir: repoDir,
    http,
    remote: 'origin',
    ref: 'refs/remotes/root/HEAD',
    remoteRef: 'refs/heads/root',
    force: true
  });

  const { upstreamURL, rootURL } = await getRepositoryURLs(context);
  let description = `This repository facilitates contributions to ${rootURL.toString()}`;
  if (upstreamURL !== rootURL) description += ` via ${upstreamURL.toString()}.`;

  context.log.info({ ...context.repo(), msg: 'Setting description' });
  await context.octokit.rest.repos.update({ ...context.repo(), description });
}

async function detachUpstream(
  upstreamProp: string | string[],
  context: Context<'custom_property_values.updated'>
): Promise<void> {
  context.log.info({ ...context.repo(), upstream: upstreamProp, msg: 'Detaching repository from upstream' });

  context.log.info({ ...context.repo(), msg: 'Deleting any old upstream/ branches on the repository.' });
  const { data: branches } = await context.octokit.rest.repos.listBranches(context.repo());
  const upstreamBranches = branches.filter(b => b.name.startsWith('upstream/'));
  for (const upstreamBranch of upstreamBranches) {
    await context.octokit.rest.git.deleteRef({ ...context.repo(), ref: `heads/${upstreamBranch.name}` });
  }

  try {
    if (Array.isArray(upstreamProp)) throw new Error(`The ${UPSTREAM_PROPERTY_NAME} property must be a single value.`);
    const upstreamURL = parseRepositoryURL(upstreamProp);
    const upstreamContext = await getUpstreamContext(context, upstreamURL);

    context.log.info('Deleting any old <downstream>/ branches on the upstream repository.');
    const { data: branches } = await upstreamContext.octokit.rest.repos.listBranches(upstreamContext.repo());
    const downstreamBranches = branches.filter(b => b.name.startsWith(`${context.payload.repository.name}/`));
    for (const downstreamBranch of downstreamBranches) {
      await upstreamContext.octokit.rest.git.deleteRef({
        ...upstreamContext.repo(),
        ref: `heads/${downstreamBranch.name}`
      });
    }
  } catch (e) {
    context.log.warn(
      'Failed to cleanup <downstream>/ branches on the upstream repository. Ignoring and continuing.',
      e
    );
    // A failure to cleanup here is tolerable.
  }
}

async function pushToUpstream(context: Context<'push'>) {
  const repoDir = await cloneRepository(context);

  const branchName = context.payload.ref.slice(20);

  const ref = `refs/remotes/origin/${branchName}`;
  const remoteRef = `refs/heads/${context.payload.repository.name}/${branchName}`;

  context.log.info({
    ...context.repo(),
    ref,
    remoteRef,
    msg: 'Fetching the upstream/ branch from the repository.'
  });
  await git.fetch({
    fs,
    dir: repoDir,
    http,
    remote: 'origin',
    ref: `refs/remotes/origin/upstream/${branchName}`,
    remoteRef: `upstream/${branchName}`,
    singleBranch: true
  });

  context.log.info({
    ...context.repo(),
    ref,
    remoteRef,
    msg: 'Pushing the upstream/ branch to the upstream repository.'
  });
  await git.push({
    fs,
    dir: repoDir,
    http,
    ref: `refs/remotes/origin/upstream/${branchName}`,
    remoteRef: `refs/heads/${context.payload.repository.name}/${branchName}`,
    remote: 'upstream'
  });
}

async function ensureUpstreamBranch(context: Context<'push'>) {
  const branchName = context.payload.ref;
  if (!branchName.startsWith('refs/heads/feature/')) throw new Error(`Expected ${branchName} to be a feature branch`);
  const upstreamBranchName = `upstream/${context.payload.ref.slice(19)}`;

  const { data: branches } = await context.octokit.rest.repos.listBranches(context.repo());
  const upstreamBranch = branches.find(branch => branch.name === upstreamBranchName);
  if (upstreamBranch) {
    context.log.info({ ...context.repo(), branch: upstreamBranchName, msg: 'Branch already exists on the upstream.' });
    return;
  }

  const { data: root } = await context.octokit.rest.git.getRef({ ...context.repo(), ref: 'heads/root' });
  await context.octokit.git.createRef({
    ...context.repo(),
    ref: `refs/heads/${upstreamBranchName}`,
    sha: root.object.sha
  });
}

async function getRepositoryURLs(context: Context<'push'>): Promise<{ upstreamURL: URL; rootURL: URL }> {
  const upstreamProp = context.payload.repository.custom_properties[UPSTREAM_PROPERTY_NAME];

  if (!upstreamProp) throw new Error(`The repository does not have the ${UPSTREAM_PROPERTY_NAME} property.`);
  if (Array.isArray(upstreamProp)) throw new Error(`The ${UPSTREAM_PROPERTY_NAME} property must be a single value.`);
  const upstreamURL = parseRepositoryURL(upstreamProp);

  const rootProp = context.payload.repository.custom_properties[ROOT_PROPERTY_NAME];
  if (Array.isArray(rootProp)) throw new Error(`The ${ROOT_PROPERTY_NAME} property must be a single value.`);

  let rootURL: URL;
  if (rootProp) {
    rootURL = parseRepositoryURL(rootProp);
  } else {
    const upstreamContext = await getUpstreamContext(context, upstreamURL);
    const { data: upstreamRepository } = await upstreamContext.octokit.rest.repos.get(upstreamContext.repo());
    rootURL = new URL(
      upstreamRepository.source?.clone_url ? upstreamRepository.source.clone_url : upstreamRepository.clone_url
    );
  }

  return { upstreamURL, rootURL };
}

function parseRepositoryURL(url: string): URL {
  try {
    return new URL(url);
  } catch (e) {
    if (url.includes('/')) {
      return new URL(`https://github.com/${url}.git`);
    } else {
      throw e;
    }
  }
}

function authenticatedURL(url: URL, token: string): URL {
  const authenticatedURL = new URL(url);
  authenticatedURL.username = 'x-access-token';
  authenticatedURL.password = token;
  return authenticatedURL;
}

function repoFromURL(url: URL): { owner: string; repo: string } {
  const components = url.pathname.split('/', 3);
  return {
    owner: components[1],
    repo: components[2].endsWith('.git') ? components[2].slice(0, -4) : components[2]
  };
}

async function getInstallationToken(
  octokitRestApi: ProbotOctokit['rest'],
  repositoryURL: URL | string
): Promise<string> {
  const repo = repoFromURL(new URL(repositoryURL));
  const { data: installation } = await octokitRestApi.apps.getRepoInstallation(repo);

  const {
    data: { token }
  } = await octokitRestApi.apps.createInstallationAccessToken({
    installation_id: installation.id,
    repositories: [repo.repo]
  });

  return token;
}

async function cloneRepository(context: Context<'push'>) {
  const repoDir = await dir({ unsafeCleanup: true });

  const originURL = new URL(context.payload.repository.clone_url);
  const { upstreamURL, rootURL } = await getRepositoryURLs(context);

  const [authenticatedOriginURL, authenticatedUpstreamURL] = await Promise.all(
    [originURL, upstreamURL].map(async url => authenticatedURL(url, await getInstallationToken(context.octokit, url)))
  );

  context.log.info({
    ...context.repo(),
    msg: 'Cloning repository',
    origin: originURL,
    upstream: upstreamURL,
    root: rootURL
  });
  await git.clone({
    fs,
    dir: repoDir.path,
    http,
    url: authenticatedOriginURL.toString(),
    noCheckout: true,
    noTags: true,
    singleBranch: true,
    remote: 'origin'
  });
  await git.addRemote({ fs, dir: repoDir.path, remote: 'upstream', url: authenticatedUpstreamURL.toString() });
  await git.addRemote({ fs, dir: repoDir.path, remote: 'root', url: rootURL.toString() });

  return repoDir.path;
}

async function getUpstreamContext(
  context: Context<'push'>,
  upstreamURL: URL
): Promise<{ octokit: Octokit; repo: () => { owner: string; repo: string } }> {
  return {
    octokit: new Octokit({ auth: await getInstallationToken(context.octokit, upstreamURL) }),
    repo: () => repoFromURL(upstreamURL)
  };
}
