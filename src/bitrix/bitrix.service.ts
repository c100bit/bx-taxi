import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import crypto from 'crypto';
import moment from 'moment';

@Injectable()
export class BitrixService {
  private readonly logger = new Logger(BitrixService.name);
  private readonly addListElementUrl: string;
  private readonly searchUserUrl: string;
  private readonly headers = {
    'Content-Type': 'application/json',
  };

  constructor(private config: ConfigService) {
    this.addListElementUrl = new URL(
      'lists.element.add',
      this.config.get('BX_URL'),
    ).toString();
    this.searchUserUrl = new URL(
      'user.search',
      this.config.get('BX_URL'),
    ).toString();
  }

  async addListElements(items: ReportItem[]) {
    const users = await Promise.all(
      items.map((item) => this.searchUser(item.client)),
    );
    const result = await Promise.all(
      items.map((item) =>
        this.addListElement(
          item,
          users.find((u) => u.name == item.client),
        ),
      ),
    );
  }

  private async addListElement(
    item: ReportItem,
    user: User,
  ): Promise<number | undefined> {
    let resultId: number;
    const params = {
      IBLOCK_TYPE_ID: 'lists',
      IBLOCK_ID: this.config.get('LIST_ID'),
      ELEMENT_CODE: crypto.randomBytes(15).toString('hex'),
      FIELDS: await this.buildElementFields(item, user),
    };

    try {
      const res = await axios.post(this.addListElementUrl, params, {
        headers: this.headers,
      });
      resultId = res.data['result'];
      this.logger.log(`Added element to list with id=${resultId}`);
    } catch (err) {
      this.logger.error(`Error while adding element to list with ${err}`);
      this.logger.debug(JSON.stringify(err));
    }
    return resultId;
  }

  private async searchUser(client: string): Promise<User> {
    let userId: string;

    try {
      const params = this.buildUserParams(client);
      const res = await axios.post(this.searchUserUrl, params, {
        headers: this.headers,
      });
      const user = res.data['result'].find((u: Object) => u['ACTIVE'] === true);
      if (user) userId = user['ID'];
      this.logger.log(`Got user with id=${userId}`);
    } catch (err) {
      this.logger.error(`Error while searching user with ${err}`);
      this.logger.debug(JSON.stringify(err));
    }

    return {
      id: userId ? userId : this.config.get('BX_USER_ID'),
      name: client,
    };
  }

  private buildUserParams(client: string) {
    const [lastName, initials] = client.split(' ');
    const [nameLtr, midddleNameLtr] = initials.split('.');
    return {
      FILTER: {
        NAME: `${nameLtr}%`,
        LAST_NAME: lastName,
        SECOND_NAME: `${midddleNameLtr}%`,
        USER_TYPE: 'employee',
      },
    };
  }

  private async buildElementFields(
    item: ReportItem,
    user: User,
  ): Promise<ElementFields> {
    const time = moment(item.callTime).format('DD.MM.YYYY hh:mm');
    const sum: rubType = `${item.sum}|RUB`;
    return {
      PROPERTY_1095: time, // Дата/Время 2020-12-31 10:10
      PROPERTY_1093: user.id, // Сотрудники 555
      PROPERTY_1092: item.departure, // Пункт забора
      PROPERTY_1097: item.destination, // Пункт высадки
      PROPERTY_1094: item.travelTime, // Время поездки (мин)
      PROPERTY_1098: item.distance, // Расстояние поездки (км)
      PROPERTY_1096: sum, // Стоимость (руб) 1150.5|RUB
      PROPERTY_1099: item.phone, // Телефон заказчика
      NAME: '-', // Цель выезда
      PROPERTY_1100: this.config.get('PROVIDER'), // Перевозчик
      PROPERTY_1101: item.licencePlate, // Гос.номер
    };
  }
}
