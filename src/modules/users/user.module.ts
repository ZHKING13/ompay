import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TangoModule } from '../addon/tango/tango.module';
import { ConfigModule } from '@nestjs/config';
import { CoreApiModule } from '../addon/core-api/core-api.module';

@Module({
  imports: [PrismaModule, TangoModule, ConfigModule, CoreApiModule],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
