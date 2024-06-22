import { TicketKind } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
export class ReserveSpotDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  spots: string[]; //['A1', 'A2']

  @IsNotEmpty()
  @IsEnum(TicketKind)
  ticket_kind: TicketKind;
  email: string;
}
