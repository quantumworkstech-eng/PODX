"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  signupEmail: string;
  setSignupEmail: (email: string) => void;
  signupStep: number;
  setSignupStep: (step: number) => void;
  resetSignup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [signupEmail, setSignupEmail] = useState("");
  const [signupStep, setSignupStep] = useState(1);

  const resetSignup = () => {
    setSignupEmail("");
    setSignupStep(1);
  };

  return (
    <AuthContext.Provider
      value={{
        signupEmail,
        setSignupEmail,
        signupStep,
        setSignupStep,
        resetSignup,
      }}
    >
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
