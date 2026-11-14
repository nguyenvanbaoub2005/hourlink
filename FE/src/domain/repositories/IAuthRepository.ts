import type { UserEntity } from '../entities/User';

export interface IAuthRepository {
  login(email: string, password: string): Promise<{ token: string; user: UserEntity }>;
  getCurrentUser(): Promise<UserEntity | null>;
  logout(): Promise<void>;
}
