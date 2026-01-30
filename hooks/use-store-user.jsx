import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../convex/_generated/api";

export function useStoreUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { user } = useUser();

  const [userId, setUserId] = useState(null);
  const storeUser = useMutation(api.users.store);

  // Evita llamar a users:store mil veces por re-renders
  const hasStoredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!user) return;

    // Si ya lo hicimos en esta sesión, cortá
    if (hasStoredRef.current) return;
    hasStoredRef.current = true;

    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress;

    // Si querés "sí o sí email", no llames a Convex si falta.
    if (!email) {
      hasStoredRef.current = false; // permite reintentar si cambia el user
      return;
    }

    const name = user.fullName || user.firstName || user.username || "Anonymous";
    const imageUrl = user.imageUrl;

    let cancelled = false;

    (async () => {
      try {
        const id = await storeUser({ name, email, imageUrl });
        if (!cancelled) setUserId(id);
      } catch (e) {
        // Si falla, permitimos reintentar
        hasStoredRef.current = false;
        throw e;
      }
    })();

    return () => {
      cancelled = true;
      // NO seteamos userId null acá porque puede generar loops/efectos raros
      hasStoredRef.current = false;
    };
  }, [isAuthenticated, storeUser, user?.id]);

  return {
    isLoading: isLoading || (isAuthenticated && userId === null),
    isAuthenticated: isAuthenticated && userId !== null,
  };
}
