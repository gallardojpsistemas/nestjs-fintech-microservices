import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        description: 'The email address of the user',
        example: 'test1@test.com',
    })
    email: string;

    @ApiProperty({
        description: 'The password for the user account',
        example: '123456',
    })
    password: string;
}
