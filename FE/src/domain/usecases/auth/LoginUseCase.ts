import type { IAuthRepository } from '../../repositories/IAuthRepository';

export class LoginUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(email: string, password: string) {
    if (!email || !password) {
      throw new Error('Email và mật khẩu không được để trống.');
    }
    return this.authRepo.login(email.trim(), password);
  }
}
