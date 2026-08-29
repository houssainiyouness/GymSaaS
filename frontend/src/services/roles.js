const ADMIN_ROLES = new Set(["SUPER_ADMIN", "COORDINATOR"]);

export function isAdmin(user) {
  return Boolean(user && ADMIN_ROLES.has(user.role));
}

export function isMember(user) {
  return Boolean(user && user.role === "MEMBER" && !isAdmin(user));
}

export function homeForUser(user) {
  if (isAdmin(user)) return "/dashboard";
  if (isMember(user)) return "/client";
  return "/";
}

export function roleLabel(user) {
  switch (user?.role) {
    case "SUPER_ADMIN":
      return "Super-administrateur";
    case "COORDINATOR":
      return "Coordinateur";
    case "MEMBER":
      return "Adhérent";
    default:
      return "Utilisateur";
  }
}

export { ADMIN_ROLES };
