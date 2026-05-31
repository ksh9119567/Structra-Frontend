/**
 * The authenticated user shape returned by DRF's GET /api/v1/accounts/get-user/
 * Shared between server components (layout) and client components (shell).
 */
export type AuthUser = {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
  phone_number: string | null;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
};
