import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BitrixService } from 'src/bitrix/bitrix.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private mailService: MailService,
    private bxService: BitrixService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log('Task started');
    const items = await this.mailService.perform();
    this.bxService.addListElements(items);
    this.logger.log('Task finished');
  }
}
