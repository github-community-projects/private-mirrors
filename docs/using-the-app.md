## How to get started working with Internal Contribution Forks

- Set up an organization to host your open source work
- Install the app into that organization
- Fork an upstream project into the organization's namespace, creating your **public fork**
- Go into the app and find the fork of the project you want to mirror
- Click **Create mirror** and give it an unambiguous name (such as `teamA-private-mirror`), creating your **private mirror**

## PR workflow once a mirror is active

- Create a pull request against the private mirror repo
- Review and merge the PR - at this step, if issues come up that require the deletion of code in the PR, you should "squash history" in the PR so the merge commit does not contain traces of the unwanted code.
- Once it's merged, the app will automatically sync the private mirror to your public fork, updating a branch whose name matches the name of the private mirror (`teamA-private-mirror`, in this example).
- You can then use that branch of the public fork as the base to open a PR to the upstream repository.
