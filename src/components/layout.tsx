import { Box, PageLayout } from "@primer/react";
import type { ReactNode } from "react";
import Header from "./header";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        px: 15,
        mx: "auto",
        width: [750, 970, 1170],
        height: "100%",
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          height: 64,
          display: "grid",
          zIndex: 1,
        }}
      >
        <Header />
      </Box>
      <PageLayout sx={{ height: "100%", width: "100%" }}>
        <PageLayout.Content sx={{ width: "100%" }}>
          {children}
        </PageLayout.Content>
      </PageLayout>
    </Box>
  );
}
