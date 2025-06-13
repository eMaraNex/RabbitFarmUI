"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import * as utils from "./utils";

interface User {
  id?: string;
  email: string;
  name: string;
  farm_id?: string;
  role_id?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, name: string, phone: string) => Promise<AuthResponse>;
  logout: () => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  resetPassword: (params: { token: string; currentPassword: string; newPassword: string }) => Promise<AuthResponse>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Function to decode JWT and check expiration
  const isTokenExpired = (token: string): boolean => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      const expiry = payload.exp * 1000;
      return Date.now() >= expiry;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true;
    }
  };

  // Function to set or clear Axios Authorization header
  const setAuthHeader = (token: string | null) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // Standardize error message extraction
  const getErrorMessage = (error: any): string => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message || "An unexpected error occurred";
    }
    return error.message || "An unexpected error occurred";
  };

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("rabbit_farm_token");
      const savedUser = localStorage.getItem("rabbit_farm_user");

      if (savedToken && savedUser) {
        try {
          // Check if token is expired
          if (!isTokenExpired(savedToken)) {
            setUser(JSON.parse(savedUser));
            setAuthHeader(savedToken); // Set token in Axios headers
          } else {
            // Clear expired token and user data
            localStorage.removeItem("rabbit_farm_token");
            localStorage.removeItem("rabbit_farm_user");
            localStorage.removeItem("rabbit_farm_id");
            setAuthHeader(null);
          }
        } catch (error) {
          console.error("Error parsing saved user or token:", error);
          localStorage.removeItem("rabbit_farm_token");
          localStorage.removeItem("rabbit_farm_user");
          localStorage.removeItem("rabbit_farm_id");
          setAuthHeader(null);
        }
      }

      // Set up Axios interceptor for 401 responses
      const interceptor = axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            localStorage.removeItem("rabbit_farm_token");
            localStorage.removeItem("rabbit_farm_user");
            localStorage.removeItem("rabbit_farm_id");
            setAuthHeader(null);
            setUser(null);
            router.push("/");
          }
          return Promise.reject(error);
        }
      );

      setIsLoading(false);

      // Cleanup interceptor on unmount
      return () => {
        axios.interceptors.response.eject(interceptor);
      };
    };

    initializeAuth();
  }, [router]);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${utils.apiUrl}/auth/login`, { email, password });
      if (response.status === 200) {
        const { user, token } = response?.data?.data ?? {};
        const userData: User = {
          email: user?.email ?? "",
          name: user?.name ?? "Farm Administrator",
          farm_id: user?.farm_id ?? "",
          role_id: user?.role_id ?? "",
        };

        // Store token and user data
        localStorage.setItem("rabbit_farm_token", token);
        localStorage.setItem("rabbit_farm_user", JSON.stringify(userData));
        localStorage.setItem("rabbit_farm_id", JSON.stringify(userData.farm_id));
        setUser(userData);
        setAuthHeader(token);

        router.push("/");
        return { success: true, message: "Login successful", data: { user: userData, token } };
      }
      return { success: false, message: "Invalid email or password" };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, phone: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${utils.apiUrl}/auth/register`, { email, password, name, phone });
      if (response.status === 201) {
        router.push("/login");
        return { success: true, message: "Registration successful. Please log in." };
      }
      return { success: false, message: "Failed to register" };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      // Clear cookies
      const clearCookies = () => {
        const cookies = document.cookie.split("; ");
        for (const cookie of cookies) {
          const [name] = cookie.split("=");
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      };
      clearCookies();

      // Preserve rabbit_farm_theme and clear other localStorage items
      const theme = localStorage.getItem("rabbit_farm_theme");
      localStorage.clear();
      if (theme) {
        localStorage.setItem("rabbit_farm_theme", theme);
      }

      // Clear user state and auth header
      setUser(null);
      setAuthHeader(null);
      router.push("/");
      return { success: true, message: "Logout successful" };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${utils.apiUrl}/auth/forgot-password`, { email });
      if (response.status === 200) {
        return { success: true, message: response.data.message || "Password reset email sent" };
      }
      return { success: false, message: "Failed to send password reset email" };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (params: { token: string; currentPassword: string; newPassword: string }): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${utils.apiUrl}/auth/reset-password`, {
        token: params.token,
        currentPassword: params.currentPassword,
        newPassword: params.newPassword,
      });
      if (response.status === 200) {
        return { success: true, message: response.data.message || "Password reset successfully" };
      }
      return { success: false, message: "Failed to reset password" };
    } catch (error) {
      return { success: false, message: getErrorMessage(error) };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, forgotPassword, resetPassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}