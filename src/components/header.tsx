import { Avatar, Box } from "@primer/react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

// The approach used in this component shows how to build a sign in and sign out
// component that works on pages which support both client and server side
// rendering, and avoids any flash incorrect content on initial page load.
export default function Header() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <Box
        as="header"
        sx={{
          py: 2,
          width: "100%",
          display: "flex",
          flexDirection: "row",
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              mr: 2,
            }}
          >
            You are not signed in
          </Box>
          <Link
            href={`/api/auth/signin`}
            onClick={(e) => {
              e.preventDefault();
              signIn();
            }}
          >
            Sign in
          </Link>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      as="header"
      sx={{
        py: 2,
        width: "100%",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <Box
        as="nav"
        sx={{
          width: "100%",
        }}
      >
        <Box
          as="ul"
          sx={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          {session?.user && (
            <Box
              as="li"
              sx={{
                listStyle: "none",
              }}
            >
              <Link href="/organizations">My Organizations</Link>
            </Box>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Box>
          {session?.user && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {session.user.image && (
                    <Avatar size={36} src={session.user.image} />
                  )}
                  <Box
                    sx={{
                      mx: 2,
                    }}
                    as="strong"
                  >
                    {session.user.email ?? session.user.name}
                  </Box>
                </Box>
              </Box>
              <Box>
                <Link
                  href="/api/auth/signout"
                  onClick={(e) => {
                    e.preventDefault();
                    signOut();
                  }}
                >
                  Sign out
                </Link>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
