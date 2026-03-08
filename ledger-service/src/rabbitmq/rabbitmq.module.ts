import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule as GoLevelUpRabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
    imports: [
        GoLevelUpRabbitMQModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                exchanges: [
                    {
                        name: 'fintech.topic',
                        type: 'topic',
                    },
                ],
                uri: configService.getOrThrow<string>('RABBITMQ_URL'),
                connectionInitOptions: { wait: false },
            }),
        }),
    ],
    exports: [GoLevelUpRabbitMQModule],
})
export class RabbitMQModule { }