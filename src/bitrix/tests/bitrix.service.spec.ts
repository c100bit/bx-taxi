import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { BitrixService } from '../bitrix.service';
import axios from 'axios';
import { reportItem } from './fixtures';
import { configTestModule } from '../../test-utils/config-test.module';

describe('MailService', () => {
  let service: BitrixService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [configTestModule()],
      providers: [BitrixService, ConfigService],
    }).compile();

    service = module.get<BitrixService>(BitrixService);
  });

  it('should be defined', () => {
    expect(service.addListElements).toBeDefined();
  });

  it('should make a request', async () => {
    jest.spyOn(axios, 'post').mockImplementation((url) => {
      switch (url) {
        case 'https://localhost/user.search':
          return Promise.resolve({
            data: { result: [{ ID: 111, ACTIVE: true }] },
          });
        case 'https://localhost/lists.element.add':
          return Promise.resolve({ data: { result: 1 } });
      }
    });
    const ids = await service.addListElements([reportItem]);
    expect(ids).toEqual([1]);
  });
});
