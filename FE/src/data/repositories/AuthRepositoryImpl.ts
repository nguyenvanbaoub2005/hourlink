import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { UserEntity } from '../../domain/entities/User';
import AuthApi from '@api/auth';
import UserApi from '@api/user';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY, REFRESH_KEY } from '@api/axiosInstance';
import { EntityMapper } from '../mappers';

export class AuthRepositoryImpl implements IAuthRepository {
  async login(email: string, password: string): Promise<{ token: string; user: UserEntity }> {
    const res = await AuthApi.login({ email, password });
    const authData = res.data?.data;
    const token = authData?.token || '';

    // Lấy thông tin user sau khi login thành công
    let user: UserEntity;
    try {
      const profileRes = await UserApi.getMyProfile();
      user = EntityMapper.toUserEntity(profileRes.data?.data || {});
    } catch {
      user = { id: '', email, fullName: email.split('@')[0] };
    }

    return { token, user };
  }

  async getCurrentUser(): Promise<UserEntity | null> {
    try {
      const res = await UserApi.getMyProfile();
      if (res.data?.data) {
        return EntityMapper.toUserEntity(res.data.data);
      }
      return null;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (token) {
        await AuthApi.logout({ token, refreshToken });
      }
    } catch {}
  }
}
