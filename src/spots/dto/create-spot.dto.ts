import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSpotDto {
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  name: string;
}
