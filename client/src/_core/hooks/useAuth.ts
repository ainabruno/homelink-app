import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      const result = await logoutMutation.mutateAsync();
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      // Afficher un toast de confirmation
      toast.success("Déconnecté avec succès", {
        description: "À bientôt!",
        duration: 2000,
      });
      // Rediriger vers la page d'accueil après logout
      if (result.redirectUrl) {
        // Attendre un peu pour que le toast soit visible
        setTimeout(() => {
          window.location.href = result.redirectUrl;
        }, 500);
      }
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      toast.error("Erreur lors de la déconnexion", {
        description: "Veuillez réessayer.",
      });
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);

  // Afficher un toast de bienvenue après connexion
  useEffect(() => {
    if (state.isAuthenticated && state.user && !meQuery.isLoading) {
      // Vérifier si c'est la première fois que l'utilisateur se connecte dans cette session
      const hasShownLoginToast = sessionStorage.getItem(
        "homelink-login-toast-shown"
      );
      if (!hasShownLoginToast) {
        toast.success("Connecté avec succès!", {
          description: `Bienvenue ${state.user.name || "utilisateur"}!`,
          duration: 3000,
        });
        sessionStorage.setItem("homelink-login-toast-shown", "true");
      }
    }
  }, [state.isAuthenticated, state.user, meQuery.isLoading]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
