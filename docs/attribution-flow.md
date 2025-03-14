# Attribution Flow

## Overview

Enteprise Managed Users (EMU) are a [feature of GitHub Enterprise Cloud](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/about-enterprise-managed-users) which provides a "walled garden" user account that cannot interact with public repositories on github.com, including filing issues, commenting on discussions, and raising pull requests. Large organizations use EMUs to provide a tighter degree of control over their user accounts, but this control can come at the cost of participation in open source communities. 

One of the goals of the Private Mirrors App is to enable contributions from EMUs, and this doc explains how to do it. 


## How Attributions Work

Git commits under the hood are associated with email addresses. GitHub makes a convenient association between email addresses and user accounts for purposes of attribution, contribution graphs, etc, but it's email underneath all that. So in the case where a contribution is crossing user accounts and especially across EMU boundaries, as long as there is some association between the public github.com user and an email address, the attributions will be linked up automatically.

For contributions which originate on a private mirror and PMA syncs to the public fork, this linkage can go in either direction:
* the public github.com account can have the EMU account's email address added as a secondary address, and commits made with that email will be attributed to the user.    **or**
* a user inside the EMU boundary can configure their git client to commit with an address associated with their public account. :arrow_left:

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

