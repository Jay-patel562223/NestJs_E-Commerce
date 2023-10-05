import {
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { decodeAuthToken } from '../utility/tokenHandler';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @Inject(UserRepository) private readonly userDB: UserRepository,
  ) {}

  async use(req: Request | any, res: Response, next: NextFunction) {
    try {
      const token = req.cookies._digi_auth_token;
      if (!token) {
        throw new UnauthorizedException('Missing auth token');
      }
      const decodedData: any = decodeAuthToken(token);
      const user = await this.userDB.findById(decodedData.id);
      if (!user) {
        throw new UnauthorizedException('Unauthorized');
      }
      user.password = undefined;
      req.user = user;
      next();
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}

export class Auth implements NestMiddleware {
  async use(req: Request | any, res: Response, next: NextFunction) {
    try {
      const token = req.cookies._digi_auth_token;
      if (!token) {
        throw new UnauthorizedException('Missing auth token123');
      }
      const decodedData: any = decodeAuthToken(token);
      const user = decodedData.id;
      if (!user) {
        throw new UnauthorizedException('Unauthorized123');
      }
      req.user = user;
      next();
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
