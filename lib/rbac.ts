import type { Role } from "./constants";
import type { SessionPayload } from "./auth";
import type { Scope } from "./queries";

// Only these roles can create/update/delete (users, campuses, assignments).
export function canManage(role: Role): boolean {
  return role === "superadmin" || role === "admin";
}

// Which roles a given role is allowed to create/manage.
export function manageableRoles(role: Role): Role[] {
  if (role === "superadmin")
    return ["admin", "hod", "capability_manager", "boa", "instructor"];
  if (role === "admin")
    return ["hod", "capability_manager", "boa", "instructor"];
  return [];
}

// Convert a session into the BigQuery scope it is allowed to read.
// superadmin / admin / hod => all campuses & subjects (empty scope = unrestricted).
export function scopeForSession(s: SessionPayload): Scope {
  switch (s.role) {
    case "superadmin":
    case "admin":
    case "hod":
      return {}; // unrestricted
    case "boa":
      return { campuses: s.campuses };
    case "capability_manager":
      return { campuses: s.campuses, subjects: s.subjects };
    case "instructor":
      return { campuses: s.campuses, subjects: s.subjects };
    default:
      return { campuses: ["__none__"] };
  }
}

// Read-only roles cannot hit mutating endpoints.
export function isReadOnly(role: Role): boolean {
  return !canManage(role);
}

// Home route per role after login.
export function homeForRole(_role: Role): string {
  return "/dashboard";
}
