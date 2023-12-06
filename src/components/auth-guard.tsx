import { getServerSession } from "next-auth";
import { GetServerSideProps } from "next/types";
import { nextAuthOptions } from "pages/api/auth/[...nextauth]";

export const getAuthServerSideProps: GetServerSideProps = async (context) => {
  const { res } = context;
  const session = await getServerSession(
    context.req,
    context.res,
    nextAuthOptions
  );

  if (!session) {
    res.writeHead(302, { Location: "/" });
    res.end();
    return { props: {} };
  }

  const { accessToken } = (session.user as any) ?? {};
  if (!accessToken) {
    res.writeHead(302, { Location: "/" });
    res.end();
    return { props: {} };
  }

  return {
    props: {
      session,
    },
  };
};
