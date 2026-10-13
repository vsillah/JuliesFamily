import { convexAuth } from "@convex-dev/auth/server";
import Auth0 from "@auth/core/providers/auth0";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Auth0],
});
