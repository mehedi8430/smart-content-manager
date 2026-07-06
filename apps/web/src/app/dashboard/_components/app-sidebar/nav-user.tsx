"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth.action";
import ReuseableAlertDialog from "@/components/reuseable-alert-dialog";

export function NavUser() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    setIsPending(true);

    try {
      const result = await logoutAction();

      if (result.success) {
        toast.success("Logged out successfully");
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // toast.error("Logout failed. Please try again.");
    } finally {
      setIsPending(false);
      router.push("/login");
    }
  };

  return (
    <>
      <ReuseableAlertDialog
        trigger={
          <Button
            variant="destructive"
            className="cursor-pointer"
            disabled={isPending}
          >
            <LogOutIcon />
            Log out
          </Button>
        }
        title="Log out?"
        description="You will be signed out of your account and need to log in again to access the dashboard."
        actionText={isPending ? "Logging out..." : "Log out"}
        cancelText="Cancel"
        onConfirm={handleLogout}
        isLoading={isPending}
      />
    </>
  );
}
