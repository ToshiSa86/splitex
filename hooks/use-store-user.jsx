"use client";

import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../convex/_generated/api";

export function useStoreUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const [userId, setUserId] = useState(null);

  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!user) return;
    if (userId) return;

    async function createUser() {
      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress;

      if (!email) return;

      const name =
        user?.fullName ||
        user?.firstName ||
        user?.username ||
        "Anonymous";

      const imageUrl = user?.imageUrl;

      const id = await storeUser({ name, email, imageUrl });
      setUserId(id);
    }

    createUser();
    return () => setUserId(null);
  }, [isAuthenticated, user, userId, storeUser]);

  return {
    isLoading: isLoading || (isAuthenticated && userId === null),
    isAuthenticated: isAuthenticated && userId !== null,
  };
}
