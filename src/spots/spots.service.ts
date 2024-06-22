import { Injectable } from '@nestjs/common';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SpotStatus } from '@prisma/client';

type CreateSpotInput = CreateSpotDto & { eventId: string };
@Injectable()
export class SpotsService {
  constructor(private prismaService: PrismaService) {}
  async create(createSpotDto: CreateSpotInput) {
    const event = await this.prismaService.event.findFirst({
      where: { id: createSpotDto.eventId },
    });

    if (!event) throw new Error('Event is invalid');
    return this.prismaService.spot.create({
      data: {
        ...createSpotDto,
        status: SpotStatus.available,
      },
    });
  }

  findAll(eventId: string) {
    return this.prismaService.spot.findMany({
      where: { eventId },
    });
  }

  findOne(eventId: string, spotId: string) {
    return this.prismaService.spot.findUnique({
      where: {
        id: spotId,
        eventId,
      },
    });
  }

  update(eventId: string, spotId: string, updateSpotDto: UpdateSpotDto) {
    return this.prismaService.spot.update({
      where: {
        id: spotId,
        eventId,
      },
      data: updateSpotDto,
    });
  }

  remove(eventId: string, spotId: string) {
    this.prismaService.spot.delete({
      where: {
        id: spotId,
        eventId,
      },
    });
  }
}
