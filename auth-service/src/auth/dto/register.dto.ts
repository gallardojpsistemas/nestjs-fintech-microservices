import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        description: 'The email address of the user',
        example: 'test3@test.com',
    })
    email: string;

    @ApiProperty({
        description: 'The password for the user account',
        example: '123456',
        minLength: 6,
    })
    password: string;
}