import { useState } from "react";
import { AuthContext } from "./AuthContextValue";
import { clearPendingInvite } from "../utils/invite";

const decodeTokenPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalizedPayload));
  } catch {
    return null;
  }
};

const normalizeUser = (user) => {
  if (!user?.role) {
    return user;
  }

  return {
    ...user,
    role: user.role.trim().toLowerCase()
  };
};

const getStoredUser = () => {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const storedRole = localStorage.getItem("role");

  if (storedUser) {
    try {
      const parsedUser = normalizeUser(JSON.parse(storedUser));

      if (parsedUser?.role) {
        return parsedUser;
      }
    } catch {
      localStorage.removeItem("user");
    }
  }

  if (storedRole) {
    return { role: storedRole.trim().toLowerCase() };
  }

  const decodedToken = storedToken ? decodeTokenPayload(storedToken) : null;

  return decodedToken?.role
    ? normalizeUser({
        id: decodedToken.id,
        role: decodedToken.role,
        institutionId: decodedToken.institutionId
      })
    : null;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const storedToken = localStorage.getItem("token");
    return storedToken ? getStoredUser() : null;
  });

  const login = (authToken, authUser) => {
    const nextUser = normalizeUser(typeof authUser === "string" ? { role: authUser } : authUser);

    if (!nextUser?.role) {
      throw new Error("Cannot store authenticated user without a role");
    }

    localStorage.setItem("token", authToken);
    localStorage.setItem("role", nextUser.role);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setToken(authToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    clearPendingInvite();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
