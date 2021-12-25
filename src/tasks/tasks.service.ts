import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { BitrixService } from 'src/bitrix/bitrix.service';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private mailService: MailService,
    private bxService: BitrixService,
    private schedulerRegistry: SchedulerRegistry,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    const ms = 60000;
    const interval = setInterval(
      async () => await this.handleInterval(),
      this.config.get<number>('INTERVAL_MIN') * ms,
    );
    this.schedulerRegistry.addInterval('appInterval', interval);
  }

  async handleInterval() {
    this.logger.log('Task started');
    const items = await this.mailService.perform();
    this.bxService.addListElements(items);
    this.logger.log('Task finished');
  }
}
