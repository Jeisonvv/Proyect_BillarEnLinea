import { Injectable } from '@nestjs/common';
import {
  createAdminUserService,
  deleteUserService,
  getUserByIdService,
  getUserByPhoneService,
  getUserByProviderService,
  listUsersService,
  updateConversationStateService,
  updateUserService,
} from '../../services/user.service.js';
import type { CreateUserDto, UpdateConversationStateDto, UpdateUserDto } from './dto/users.dto.js';

@Injectable()
export class UsersNestService {
  createUser(data: CreateUserDto) {
    return createAdminUserService(data);
  }

  listUsers(params: {
    status?: string;
    role?: string;
    playerCategory?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    return listUsersService(params);
  }

  getUserByPhone(phone: string) {
    return getUserByPhoneService(phone);
  }

  getUserByProvider(provider: string, providerId: string) {
    return getUserByProviderService(provider, providerId);
  }

  getUserById(id: string) {
    return getUserByIdService(id);
  }

  updateConversationState(id: string, data: UpdateConversationStateDto) {
    return updateConversationStateService(id, data);
  }

  updateUser(id: string, data: UpdateUserDto) {
    return updateUserService({ id, data });
  }

  deleteUser(id: string) {
    return deleteUserService(id);
  }
}