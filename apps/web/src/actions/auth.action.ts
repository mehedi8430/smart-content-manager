"use server";

import fetcher from "@/lib/fetcher";
import {
  TGetMeResponse,
  TLoginPayload,
  TLoginResponse,
  TLogoutResponse,
  TSignupPayload,
  TSignupResponse
} from "@/types/auth.type";
import { cookies } from "next/headers";

/**
 * Login action
 */
export async function loginAction(values: TLoginPayload) {
  try {
    const response = await fetcher<TLoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(values),
    });
    // console.log("login action response", response);

    if (!response?.data?.accessToken) {
      return { error: "Login failed - no tokens received" };
    }

    // Set cookies (HttpOnly, Secure, etc.)
    const cookieStore = await cookies();

    cookieStore.set("accessToken", response?.data?.accessToken || "", {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
    });
    cookieStore.set("refreshToken", response?.data?.refreshToken || "", {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
    });

    return {
      message: "Login successful",
      user: response.data,
      success: true
    };
  } catch (error) {
    // If error is an object with a message property, use that
    if (error && typeof error === "object" && "message" in error) {
      return { error: (error as { message: string }).message };
    }

    return { error: "Login failed. Please try again." };
  }
}

/**
 * Signup action
 */
export async function signupAction(payload: TSignupPayload) {
  try {
    const response = await fetcher<TSignupResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: response.success,
      message: response.message,
      data: response.data,
    };
  } catch (error) {
    if (error && typeof error === "object" && "message" in error) {
      return { error: (error as { message: string }).message };
    }

    return { error: "Signup failed. Please try again." };
  }
}

/**
 * Logout action
 */
export async function logoutAction() {
  try {
    const response = await fetcher<TLogoutResponse>("/auth/logout", {
      method: "POST",
    });

    // Clear cookies
    const cookieStore = await cookies();
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");

    return {
      success: response.success,
      message: response.message
    };
  } catch (error) {
    // Even if API fails, clear local cookies
    const cookieStore = await cookies();
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");

    if (error && typeof error === "object" && "message" in error) {
      return { error: (error as { message: string }).message };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Logout failed. Please try again."
    };
  }
}

/**
 * Get current user from token
 */
export async function getLoggedinUserAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetcher<TGetMeResponse>("/auth/me", {
      method: "GET",
    });

    return {
      success: response.success,
      data: response.data,
    };
  } catch (error) {
    if (error && typeof error === "object" && "message" in error) {
      return { error: (error as { message: string }).message };
    }

    return { error: "Failed to get user. Please try again." };
  }
}
