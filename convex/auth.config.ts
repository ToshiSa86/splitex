import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://sharing-muskrat-34.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;


