export const SUPER_ADMIN_EMAIL = "talibhassan1122@gmail.com"

export function isSuperAdmin(email?: string | null): boolean {
  return email === SUPER_ADMIN_EMAIL
}
