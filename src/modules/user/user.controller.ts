import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateUserDto, type UserDto } from '../../dtos/user';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UsePipes(ValidationPipe)
  @Post()
  createUser(@Body() createUser: CreateUserDto): Promise<UserDto> {
    return this.userService.createUser(createUser);
  }
}
