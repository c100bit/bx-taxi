import { ConfigModule } from '@nestjs/config';

export const configTestModule = () =>
  ConfigModule.forRoot({
    envFilePath: '.test.env',
  });
