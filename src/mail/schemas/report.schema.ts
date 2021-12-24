import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema()
export class Report {
  @Prop()
  messageId: string;

  @Prop()
  messageDate: Date;

  @Prop()
  itemsCount: number;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
