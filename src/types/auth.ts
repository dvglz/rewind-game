export interface AuthUser {
  id: number;
  objectId: string;
  username: string | null;
  email: string | null;
  firstName: string;
  lastName: string;
  accessToken: string;
  avatarUrl: string | null;
  thumbnailUrl: string | null;
}
