import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from '../mail.service';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '../../test-utils/mongoose-test.module';
import { configTestModule } from '../../test-utils/config-test.module';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from '../schemas/report.schema';
import { Client } from 'yapople';
import { createMsg } from './fixtures';
import { Connection } from 'mongoose';

describe('MailService', () => {
  let service: MailService;
  let connection: Connection;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(),
        configTestModule(),
        MongooseModule.forFeature([
          { name: Report.name, schema: ReportSchema },
        ]),
      ],
      providers: [MailService, ConfigService],
    }).compile();

    service = module.get<MailService>(MailService);
    connection = await module.get(getConnectionToken());
  });

  afterAll(async () => {
    await connection.close();
    await closeInMongodConnection();
  });

  it('should be defined', () => {
    expect(service.perform).toBeDefined();
  });

  it('should be performed', async () => {
    const msg = await createMsg();
    jest
      .spyOn(Client.prototype, 'connect')
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(Client.prototype, 'retrieveAll')
      .mockImplementation(() => Promise.resolve([null, msg]));

    const items = await service.perform();
    expect(items.length).toBe(1);
    expect(items[0].client).toBe('Petrov P.P.');
  });
});
