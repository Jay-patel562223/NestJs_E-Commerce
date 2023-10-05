import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { userTypes } from '../schema/users';
import { ROLES_KEY } from './role.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireRoles = this.reflector.getAllAndOverride<userTypes[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requireRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requireRoles.some((role) => user.type?.includes(role));
  }
}
