import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './schemas/report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
