import { BadRequestException, Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UserDto } from '../../dtos/user';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(user: CreateUserDto): Promise<UserDto> {
    const { email, password, confirmPassword, username } = user;

    const userExists = await this.prisma.user.findFirst({
      where: { email },
    });

    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Password do not match');
    }

    const passwordHash = await hash(password, 10);

    return await this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
        username,
      },
      omit: {
        password: true,
      },
    });
  }
}
