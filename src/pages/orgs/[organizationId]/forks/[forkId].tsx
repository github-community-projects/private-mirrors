import { Octokit } from "@octokit/rest";
import { PlusIcon } from "@primer/octicons-react";
import { Box, Button, Flash, Link, Spinner } from "@primer/react";
import { personalOctokit } from "bot/octokit";
import { getAuthServerSideProps } from "components/auth-guard";
import { CreateMirrorDialog } from "components/create-mirror";
import { useRouter } from "next/router";
import type { InferGetServerSidePropsType } from "next/types";
import { useCallback, useEffect, useState } from "react";
import { trpc } from "utils/trpc";

const getOrgInformation = async (accessToken: string, orgId: string) => {
  return (await personalOctokit(accessToken).orgs.get({ org: orgId })).data;
};

const getForkById = async (
  accessToken: string,
  repoId: string
): Promise<Awaited<ReturnType<Octokit["repos"]["get"]>>["data"]> => {
  return (
    await personalOctokit(accessToken).request("GET /repositories/:id", {
      id: repoId,
    })
  ).data;
};

const findMirrors = async (
  accessToken: string,
  orgName: string,
  forkName: string
) => {
  return (
    await personalOctokit(accessToken).search.repos({
      q: `org:${orgName} in:description "mirror:${orgName}/${forkName}"`,
    })
  ).data;
};

const SingleFork = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const { accessToken } = (props.session?.user as any) ?? {};
  const router = useRouter();
  const { organizationId, forkId } = router.query;
  const [isOpen, setIsOpen] = useState(false);
  const closeDialog = useCallback(() => setIsOpen(false), [setIsOpen]);
  const openDialog = useCallback(() => setIsOpen(true), [setIsOpen]);
  const [orgData, setOrgData] = useState<Awaited<
    ReturnType<typeof getOrgInformation>
  > | null>(null);
  const [fork, setFork] = useState<Awaited<
    ReturnType<typeof getForkById>
  > | null>(null);
  const [mirrors, setMirrors] = useState<Awaited<
    ReturnType<typeof findMirrors>
  > | null>(null);
  const {
    mutate: createMirror,
    error: mirrorError,
    data,
    isLoading,
  } = trpc.git.createMirror.useMutation();

  const loadAllData = useCallback(async () => {
    const orgInfo = await getOrgInformation(
      accessToken,
      organizationId as string
    );
    setOrgData(orgInfo);

    let forkInfo;
    try {
      forkInfo = await getForkById(accessToken, forkId as string);
      setFork(forkInfo);
    } catch (e) {
      console.error(e);
      return;
    }

    const mirrorInfo = await findMirrors(
      accessToken,
      orgInfo.login,
      forkInfo.name
    );
    setMirrors(mirrorInfo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, organizationId, forkId, data]);

  useEffect(() => {
    if (!accessToken || !organizationId) {
      return;
    }

    loadAllData();
  }, [organizationId, accessToken, loadAllData]);

  const handleOnCreateMirror = useCallback(
    ({ repoName, branchName }: { repoName: string; branchName: string }) => {
      createMirror({
        newRepoName: repoName,
        newBranchName: branchName,
        orgId: String(orgData?.id),
        forkRepoName: fork?.name ?? "",
        forkRepoOwner: fork?.owner.login ?? "",
        forkId: String(fork?.id),
      });

      closeDialog();
    },
    [closeDialog, createMirror, orgData, fork]
  );

  if (!orgData) {
    return <div>Loading fork data...</div>;
  }

  return (
    <Box>
      <Box>
        {mirrorError && <Flash variant="danger">{mirrorError.message}</Flash>}
      </Box>
      <Box>
        {data && (
          <Flash variant="success">
            Success! New repo created at{" "}
            <Link href={data.data.html_url}>
              {data.data.owner.login}/{data.data.name}
            </Link>
          </Flash>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href={`https://github.com/${orgData.login}/${fork?.name}`}
          target="_blank"
        >
          <h3>
            {orgData.login} / {fork?.name}
          </h3>
        </Link>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {isLoading && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              Creating new repo{" "}
              <Spinner
                sx={{
                  ml: 2,
                  mr: 4,
                }}
              />
            </Box>
          )}
          <Button
            variant="primary"
            leadingVisual={PlusIcon}
            onClick={openDialog}
          >
            Create Mirror
          </Button>
        </Box>
      </Box>
      <Box>
        {!mirrors && <Box>Loading mirrors...</Box>}
        {mirrors && mirrors.items.length === 0 && (
          <Box>No mirrors found for this fork</Box>
        )}
        <Box>
          {mirrors &&
            mirrors.items.map((mirror) => (
              <Box key={mirror.id}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    my: 2,
                  }}
                >
                  <Link
                    href={`https://github.com/${orgData.login}/${mirror.name}`}
                    target="_blank"
                  >
                    {mirror.name}
                  </Link>
                </Box>
              </Box>
            ))}
        </Box>
      </Box>
      <CreateMirrorDialog
        isOpen={isOpen}
        closeDialog={closeDialog}
        onCreateMirror={handleOnCreateMirror}
      />
    </Box>
  );
};

export default SingleFork;

export const getServerSideProps = getAuthServerSideProps;
