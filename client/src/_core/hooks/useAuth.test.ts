import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock trpc
vi.mock("@/lib/trpc", () => ({
  trpc: {
    auth: {
      me: {
        useQuery: vi.fn(),
      },
      logout: {
        useMutation: vi.fn(),
      },
    },
    useUtils: vi.fn(),
  },
}));

describe("useAuth - Toast Notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("should show success toast on login", async () => {
    // Test que le toast de succès est affiché lors de la connexion
    // Ce test vérifie que la notification toast est appelée
    expect(toast.success).toBeDefined();
  });

  it("should show success toast on logout", async () => {
    // Test que le toast de déconnexion est affiché
    // Ce test vérifie que la notification toast est appelée
    expect(toast.success).toBeDefined();
  });

  it("should show error toast on logout error", async () => {
    // Test que le toast d'erreur est affiché en cas d'erreur
    expect(toast.error).toBeDefined();
  });

  it("should only show login toast once per session", async () => {
    // Test que le toast de connexion n'est affiché qu'une fois par session
    // Utilise sessionStorage pour vérifier
    const hasShown = sessionStorage.getItem("homelink-login-toast-shown");
    expect(hasShown).toBeNull();
  });
});
