import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { userTypes } from 'src/shared/schema/users';
import { UserRepository } from 'src/shared/repositories/user.repository';
import {
  comparePassword,
  generateHashPassword,
} from 'src/shared/utility/passwordHandler';
import { sendEmail, htmlTemplate } from 'src/shared/utility/emailHandler';
import { generateAuthToken } from 'src/shared/utility/tokenHandler';
import { compareOtp, generateHashOtp } from 'src/shared/utility/otpHandler';

@Injectable()
export class UsersService {
  constructor(
    @Inject(UserRepository) private readonly userDB: UserRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      //* generate the hash passsword
      createUserDto.password = await generateHashPassword(
        createUserDto.password,
      );

      //* Check is it for admin
      if (
        createUserDto.type === userTypes.ADMIN &&
        createUserDto.secretToken !== process.env.ADMIN_SECRET_TOKEN
      ) {
        throw new Error('Not allowed to create admin!');
      } else if (createUserDto.type !== userTypes.CUSTOMER) {
        createUserDto.isVerified = true;
      }

      //* user is already exist
      const user = await this.userDB.findOne({
        email: createUserDto.email,
      });
      if (user) {
        throw new Error('User already exist!');
      }

      //* generate the OTP
      const otp: number = Math.floor(Math.random() * 900000) + 100000;
      const hashOtp: string = await generateHashOtp(otp.toString());
      const otpExpiryTime = new Date();
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);

      //* create a new user
      const newUser = await this.userDB.create({
        ...createUserDto,
        otp: hashOtp,
        otpExpiryTime,
      });
      if (newUser.type !== userTypes.ADMIN) {
        let html = htmlTemplate('sign up', otp);
        sendEmail(newUser.email, 'Verify Your Email', html);
      }

      return {
        success: true,
        message:
          newUser.type === userTypes.ADMIN
            ? 'Admin created successfully'
            : 'Please activate your account by verifying your email. we have sent you a email with the otp',
        result: {
          name: newUser.name,
          email: newUser.email,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const userExists = await this.userDB.findOne({
        email,
      });
      if (!userExists) {
        throw new Error('User not found!');
      }
      if (!userExists.isVerified) {
        throw new Error('Please verify your email');
      }

      const isPasswordMatch = await comparePassword(
        password,
        userExists.password,
      );
      if (!isPasswordMatch) {
        throw new Error('Invalid email or password');
      }

      const token = await generateAuthToken(userExists._id.toString());

      return {
        success: true,
        message: 'Login successful',
        result: {
          user: {
            _id: userExists.id.toString(),
            name: userExists.name,
            email: userExists.email,
            type: userExists.type,
          },
          token: token,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(email: string, otp: string) {
    try {
      const user = await this.userDB.findOne({
        email,
      });
      if (!user) {
        throw new Error('User not found!');
      }
      if (!(await compareOtp(otp, user?.otp))) {
        throw new Error('Invalid otp');
      }
      if (user.otpExpiryTime < new Date()) {
        throw new Error('otp expired');
      }

      const verifiedUser = await this.userDB.findOneAndUpdate(
        {
          email,
        },
        {
          isVerified: true,
          otp: '',
          otpExpiryTime: null,
        },
      );

      return {
        success: true,
        message: 'Email verified successfully',
        result: {
          _id: verifiedUser.id.toString(),
          name: verifiedUser.name,
          email: verifiedUser.email,
          type: verifiedUser.type,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async sendOtpEmail(email: string, isForgotPassword: any) {
    try {
      const user = await this.userDB.findOne({
        email,
      });
      if (!user) {
        throw new Error('User not found!');
      }
      if (user.isVerified && isForgotPassword != 1) {
        throw new Error('Email already verified');
      }

      const otp: number = Math.floor(Math.random() * 900000) + 100000;
      const hashOtp: string = await generateHashOtp(otp.toString());

      const otpExpiryTime = new Date();
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);

      await this.userDB.findOneAndUpdate(
        {
          email,
        },
        {
          otp: hashOtp,
          otpExpiryTime,
        },
      );
      let html = htmlTemplate(
        isForgotPassword == 1 ? 'forgot password' : 'sign up',
        otp,
      );
      sendEmail(
        user.email,
        isForgotPassword == 1 ? 'Forgot Your Password' : 'Verify Your Email',
        html,
      );

      return {
        success: true,
        message: 'Otp sent successfully',
        result: { email: user.email },
      };
    } catch (error) {
      throw error;
    }
  }

  async forgotPasswordEmail(email: string) {
    try {
      const user = await this.userDB.findOne({
        email,
      });
      if (!user) {
        throw new Error('User not found!');
      }

      const otp: number = Math.floor(Math.random() * 900000) + 100000;
      const hashOtp: string = await generateHashOtp(otp.toString());

      const otpExpiryTime = new Date();
      otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 10);

      await this.userDB.findOneAndUpdate(
        {
          email,
        },
        {
          otp: hashOtp,
          otpExpiryTime,
        },
      );
      let html = htmlTemplate('forgot password', otp);
      sendEmail(user.email, 'Forgot Your Password', html);

      return {
        success: true,
        message: 'Otp sent successfully',
        result: { email: user.email },
      };
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(email: string, newPasssword: string) {
    const user = await this.userDB.findOne({
      email,
    });
    if (!user) {
      throw new Error('User not found!');
    }
    if (!newPasssword || newPasssword == '') {
      throw new Error('New password is required!');
    }
    const password = await generateHashPassword(newPasssword);

    await this.userDB.findOneAndUpdate(
      {
        email,
      },
      {
        password,
      },
    );

    return {
      success: true,
      message: 'Password change successfully',
      result: {
        email,
      },
    };
  }

  async findAll(type: string) {
    try {
      const user = await this.userDB.find({type})
      return {
        success: true,
        message: 'User fetched successfully',
        result: user
      }
      
    } catch (error) {
      throw error
    }


  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
