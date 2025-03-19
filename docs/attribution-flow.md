# Attribution Flow

## Overview

Enterprise Managed Users (EMU) are a [feature of GitHub Enterprise Cloud](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/about-enterprise-managed-users) which provides a "walled garden" user account that cannot interact with public repositories on github.com, including filing issues, commenting on discussions, and raising pull requests. Large organizations use EMUs to provide a tighter degree of control over their user accounts, but this control can come at the cost of participation in open source communities.

One of the goals of the Private Mirrors App is to enable contributions from EMUs, and this doc explains how to do it.

## How Attributions Work

Git commits under the hood are associated with email addresses. GitHub makes a convenient association between email addresses and user accounts for purposes of attribution, contribution graphs, etc, but it's email underneath all that. So in the case where a contribution is crossing user accounts and especially across EMU boundaries, as long as there is some association between the public github.com user and an email address, the attributions will be linked up automatically.

For contributions which originate on a private mirror and PMA syncs to the public fork, this linkage can go in either direction:

- the public github.com account can have the EMU account's email address added as a secondary address, and commits made with that email will be attributed to the user. **or**
- a user inside the EMU boundary can configure their git client to commit with an address associated with their public account. :arrow_left:

We recommend the second option because it does not expose any internal information, namely the user's email address, to the public contribution graph.

Sometimes stakeholders will raise the idea of funneling all contributions through a "role" account like `@bigcorp-opensource`, but we strongly discourage this. It's both bad for maintainers (people want contributions from humans not corporations) and for contributors (the attribution of their work to the open source world is often a primary driver for wanting to contribute in the first place).

## Configuring git-config

So, to ensure that contributions made by an EMU are properly attributed to their public GitHub account, the user needs to configure their local git-config to use an email address associated with their public account. This should be done at the repository level, when they are working in a private mirror managed by PMA, rather than as a global configuration.

```sh
git config --local user.email "your-public-email@example.com"
```

## Example

Here is an example of how the attribution flow works:

1. An EMU user configures their local git-config to use the email address associated with their public GitHub account.
2. The user makes a contribution to a private mirror repository.
3. The contribution is reviewed and merged into the private mirror's default branch.
4. The Private Mirrors App automatically syncs the private mirror to the public fork.
5. The contribution is now visible in the public fork and is attributed to the user's public GitHub account.
6. The user can then switch to their public account and open a pull request from the public fork to the upstream repository, and the contribution will be properly attributed to their public identity.

### Automatically Configuring Git (Advanced)

Git config supports a [conditional includes feature](https://git-scm.com/docs/git-config#_conditional_includes) to automatically include configuration conditionally based on metadata of the repository locally. Email, a [key for signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits), and other helpful settings can be configured automatically with this feature. It helps prevent mistakes from forgetting to configure settings within each repository.

To configure conditional includes, start by creating a file in the same user directory where your `.gitconfig` is stored. Add the following content to the file:

```ini
[user]
    # replace this with your email address
    email = your-public-email@example.com
    # remove this option if not used
    signingKey = <signing key goes here>
```

This file can be named anything, but for this example, we'll call it `.gitconfig-pma`.

Then, add configuration to your `.gitconfig` to conditionally use the `.gitconfig-pma` file when in a repository used for contributions through PMA:

```ini
# Include config based on the remote HTTPS URL of the repository
# Replace the github.com remote URL below with the remote URL used for private mirror contributions
[includeIf "hasconfig:remote.*.url:https://github.com/**"]
  path = .gitconfig-pma

# Include config based on the remote git URL of the repository
# Replace the github.com remote URL below with the remote URL used for private mirror contributions
[includeIf "hasconfig:remote.*.url:git@github.com*/**"]
  path = .gitconfig-pma

# Include config based on directory in which the repository resides
# Replace the **/pma/** directory example below with the directory used for private mirror contributions
[includeIf "gitdir:**/pma/**/.git"]
  path = .gitconfig-pma
```

Choose one or more of the above options, based on your needs; not all configuration approaches may be needed.

With this configured, git should automatically set the user email and any other settings defined in the conditional config within matching repositories. You can verify the settings are applied by running `git config get <option>` in a repository used for contributions through PMA:

```sh
git config get user.email
```

Review the [git config documentation on conditional includes](https://git-scm.com/docs/git-config#_conditional_includes) for additional information and examples.
