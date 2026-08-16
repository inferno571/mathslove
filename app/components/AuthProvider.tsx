'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type UserSession = {
  userId: number;
} | null;

const AuthContext = createContext<{
  session: UserSession;
  loading: boolean;
}>({ session: null, loading: true });

export function AuthProvider({ 
  children, 
  initialSession 
}: { 
  children: React.ReactNode, 
  initialSession: UserSession 
}) {
  return (
    <AuthContext.Provider value={{ session: initialSession, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
