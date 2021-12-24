import { Module } from '@nestjs/common';
import { BitrixModule } from 'src/bitrix/bitrix.module';
import { MailModule } from 'src/mail/mail.module';
import { TasksService } from './tasks.service';

@Module({
  imports: [BitrixModule, MailModule],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
