import type { IAuthRepository } from '../../repositories/IAuthRepository';
import type { UserEntity } from '../../entities/User';

export class GetProfileUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(): Promise<UserEntity | null> {
    return this.authRepo.getCurrentUser();
  }
}
