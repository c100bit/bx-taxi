import { IsDate, IsInt, IsString } from 'class-validator';

export class CreateReportDto {
  @IsString()
  readonly messageId: string;

  @IsDate()
  readonly messageDate: Date;

  @IsInt()
  readonly itemsCount: number;
}
