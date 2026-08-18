import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  confirmPassword!: string;
}

export interface UserDto {
  id: number;
  username: string;
  email: string;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}
