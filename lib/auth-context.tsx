"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import * as utils from "./utils";

interface User {
  email: string;
  name: string;
  farm_id?: string;
  role_id?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
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
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expiry;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true; // Treat invalid tokens as expired
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await axios.post(`${utils.apiUrl}/auth/login`, {
        email,
        password,
      });

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
        setAuthHeader(token); // Set token in Axios headers

        router.push("/");
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("rabbit_farm_token");
    localStorage.removeItem("rabbit_farm_user");
    localStorage.removeItem("rabbit_farm_id");
    setAuthHeader(null); // Clear Axios headers
    router.push("/"); // Redirect to login page
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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