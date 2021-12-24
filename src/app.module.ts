import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://mongodb/bx-taxi'),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TasksModule,
  ],
})
export class AppModule {}
