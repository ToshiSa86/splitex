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
    // 1) Si no está logueado, no hacemos nada
    if (!isAuthenticated) return;

    // 2) Si Clerk todavía no cargó el user, no hacemos nada
    if (!user) return;

    // 3) Si ya lo guardamos, no lo vuelvas a guardar
    if (userId) return;

    async function createUser() {
      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress;

      // Si no hay email, no guardamos (evita "Anonymous" sin email)
      if (!email) return;

      const
