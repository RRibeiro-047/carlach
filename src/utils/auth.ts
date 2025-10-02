const ADMIN_PASSWORD = "carlachrodrigo";
const AUTH_KEY = "carlach_admin_auth";

export const login = (password: string): boolean => {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(AUTH_KEY, "authenticated");
    return true;
  }
  return false;
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem(AUTH_KEY) === "authenticated";
};
