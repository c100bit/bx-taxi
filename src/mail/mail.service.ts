import { Injectable, Logger } from '@nestjs/common';
import { Client, Message, MessageAttachment } from 'yapople';
import { Parser } from 'xml2js';
import moment from 'moment';
import iconv from 'iconv-lite';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';
import { CreateReportDto } from './dto/create-report-dto';
import { Report, ReportDocument } from './schemas/report.schema';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly parser: Parser;
  private readonly client: Client;
  private readonly email: string;
  private readonly sourceEmail: string;
  private readonly sourceSub: string;

  constructor(
    private config: ConfigService,
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
  ) {
    this.email = this.config.get('EMAIL_USERNAME');
    this.sourceEmail = this.config.get('SOURCE_EMAIL');
    this.sourceSub = this.config.get('SOURCE_SUB');

    this.client = new Client({
      host: this.config.get('EMAIL_HOST'),
      port: this.config.get('EMAIL_PORT'),
      tls: false,
      mailparser: true,
      username: this.email,
      password: this.config.get('EMAIL_PASSWORD'),
    });
    this.parser = new Parser({ explicitArray: false });
  }

  async perform(): Promise<ReportItem[]> {
    this.logger.log(`Checking email addr=${this.email}`);
    let messages: Message[] = [];
    try {
      await this.client.connect();
      messages = await this.client.retrieveAll();
      messages.shift();

      const items = await Promise.all(
        messages.map((msg) => this.processMsg(msg)),
      ).then((result) => result.flat());
      this.logger.log(`Received total: ${items.length} items`);
      return items;
    } catch (err) {
      this.logger.error(`Error while processing emails with ${err}`);
      return [];
    } finally {
      await this.client.quit();
    }
  }

  private async createReport(
    createReportDto: CreateReportDto,
  ): Promise<Report> {
    const createdReport = new this.reportModel(createReportDto);
    return await createdReport.save();
  }

  async findReport(messageId: string): Promise<Report> {
    return await this.reportModel.findOne({ messageId }).exec();
  }

  private async processMsg(msg: Message): Promise<ReportItem[]> {
    const report = await this.findReport(msg.messageId);
    if (report !== null) return [];

    const addr = msg.from[0].address;
    const sub = msg.subject;
    this.logger.log(`Received msg from=${addr} with sub=${sub}`);

    if (addr !== this.sourceEmail || sub !== this.sourceSub) {
      this.logger.log(`Skipping, cause invalid addr or subject`);
      return [];
    }

    const items = await Promise.all(
      msg.attachments?.map((attachment) => this.processAttachment(attachment)),
    ).then((result) => result.flat());

    await this.createReport({
      messageId: msg.messageId,
      messageDate: msg.date,
      itemsCount: items.length,
    });

    return items;
  }

  private async processAttachment(
    attachment: MessageAttachment,
  ): Promise<ReportItem[]> {
    this.logger.log(`Started processing attachment=${attachment.fileName}`);
    try {
      const data = await this.parser.parseStringPromise(
        iconv.encode(iconv.decode(attachment.content, 'win1251'), 'utf8'),
      );
      let childs = data['preparedreport']['previewpages']['page0']['b1'];
      childs = Array.isArray(childs) ? childs : [childs];
      const items = childs.map((item: Object) => this.buildItem(item));
      this.logger.log(
        `Finished processing attachment=${attachment.fileName}: ${items.length} items`,
      );
      return items;
    } catch (err) {
      this.logger.error(
        `Error while processing attachment=${attachment.fileName} with ${err}`,
      );
      return [];
    }
  }

  private buildItem(item: Object): ReportItem {
    const [min, sec] = item['m13']['$']['x'].split(':');
    const travelTime = Math.round((parseInt(min) * 60 + parseInt(sec)) / 60);
    const destination = item['m5']['$']['x'] ? item['m5']['$']['x'] : '-';
    const sum = parseFloat(item['m6']['$']['x'].replace(/,/g, '.'));
    const distance = parseFloat(item['m14']['$']['x'].replace(/,/g, '.'));
    const departure = item['m3']['$']['x'].replace(/\//g, '');

    return {
      idx: item['m1']['$']['x'],
      callTime: moment(item['m2']['$']['x'], 'DD.MM.YYYY hh:mm').toDate(),
      departure: departure,
      client: item['m4']['$']['x'],
      destination: destination,
      sum: sum,
      stops: item['m7']['$']['x'],
      driverCall: item['m8']['$']['x'],
      licencePlate: item['m9']['$']['x'],
      carCall: item['m10']['$']['x'],
      startTime: moment(item['m12']['$']['x'], 'hh:mm DD.MM.YYYY').toDate(),
      stopTime: moment(item['m11']['$']['x'], 'hh:mm DD.MM.YYYY').toDate(),
      travelTime: travelTime,
      distance: distance,
      phone: item['m16']['$']['x'],
    };
  }
}
