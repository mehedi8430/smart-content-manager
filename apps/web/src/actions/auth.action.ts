"use server";

import fetcher from "@/lib/fetcher";
import { TLoginPayload, TLoginResponse, TLogoutResponse, TSignupPayload, TSignupResponse } from "@/types/auth.type";
import { cookies } from "next/headers";

/**
 * Login action
 */
export async function loginAction(values: TLoginPayload) {
  try {
    const response = await fetcher<TLoginResponse>("/v2/auth/login", {
      method: "POST",
      body: JSON.stringify(values),
    });

    if (!response?.data?.accessToken) {
      return { error: "Login failed - no tokens received" };
    }

    // Set cookies (HttpOnly, Secure, etc.)
    const cookieStore = await cookies();
    cookieStore.set("access_token", response?.data?.accessToken || "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return { message: "Login successful", user: response.data, success: true };
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
    const response = await fetcher<TSignupResponse>("/v2/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      success: response.success,
      message: response.message,
      data: response,
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
    const response = await fetcher<TLogoutResponse>("/v2/auth/logout", {
      method: "GET",
    });
    console.log("logout action response", response);

    // Clear cookies
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("user_role");

    return { success: true };
  } catch (error) {
    // Even if API fails, clear local cookies
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    cookieStore.delete("user_role");

    if (error && typeof error === "object" && "message" in error) {
      return { error: (error as { message: string }).message };
    }

    return { error: "Logout failed. Please try again." };
  }
}

/**
 * Get current user from token
 */
export async function getLoggedinUserAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetcher<UserByTokenResponse>("/v2/auth/me", {
      method: "GET",
    });

    return {
      success: response.result,
      data: response.user,
    };
  } catch (error) {
    if (error && typeof error === "object" && "message" in error) {
      return { error: (error as { message: string }).message };
    }

    return { error: "Failed to get user. Please try again." };
  }
}