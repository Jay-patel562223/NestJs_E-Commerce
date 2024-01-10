import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Res,
  Put,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Response } from 'express';
import { Roles } from 'src/shared/middleware/role.decorators';
import { userTypes } from 'src/shared/schema/users';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginUser: { email: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const loginRes = await this.usersService.login(
      loginUser.email,
      loginUser.password,
    );
    if (loginRes.success) {
      response.cookie('_digi_auth_token', loginRes.result?.token, {
        httpOnly: true,
        secure: true,
      });
    }
    delete loginRes.result?.token;
    return loginRes;
  }

  @Get('/verify-email/:email/:otp')
  async verifyEmail(@Param('email') email: string, @Param('otp') otp: string) {
    return await this.usersService.verifyEmail(email, otp);
  }

  @Get('send-otp-email/:email')
  async sendOtpEmail(
    @Param('email') email: string,
    @Body() forgotPassword: { isForgotPassword: any },
  ) {
    return await this.usersService.sendOtpEmail(
      email,
      forgotPassword.isForgotPassword,
    );
  }

  @Get('forgot-password-email/:email')
  async forgotPasswordEmail(@Param('email') email: string) {
    return await this.usersService.forgotPasswordEmail(email);
  }

  @Patch('/forgot-password/:email')
  async forgotPassword(
    @Param('email') email: string,
    @Body() newPassword: { newPassword: string },
  ) {
    return await this.usersService.forgotPassword(
      email,
      newPassword.newPassword,
    );
  }

  @Put('/logout')
  async logout(@Res() res: Response) {
    res.clearCookie('_digi_auth_token');
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Logout successfully',
    });
  }

  @Get()
  @Roles(userTypes.ADMIN)
  async findAll(@Query('type') type: string) {
    return await this.usersService.findAll(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
