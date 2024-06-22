import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ReserveSpotDto } from './dto/reserve-spot.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, SpotStatus, TicketStatus } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prismaService: PrismaService) {}
  create(createEventDto: CreateEventDto) {
    return this.prismaService.event.create({
      data: {
        ...createEventDto,
        date: new Date(createEventDto.date),
      },
    });
  }

  findAll() {
    return this.prismaService.event.findMany();
  }

  findOne(id: string) {
    return this.prismaService.event.findUnique({ where: { id: id } });
  }

  update(id: string, updateEventDto: UpdateEventDto) {
    return this.prismaService.event.update({
      data: {
        ...updateEventDto,
        date: new Date(updateEventDto.date),
      },
      where: {
        id: id,
      },
    });
  }

  remove(id: string) {
    return this.prismaService.event.delete({ where: { id: id } });
  }

  async reserveSpot(dto: ReserveSpotDto & { eventId: string }) {
    const spots = await this.prismaService.spot.findMany({
      where: {
        eventId: dto.eventId,
        name: {
          in: dto.spots,
        },
      },
    });

    if (spots.length !== dto.spots.length) {
      const foundSpotsName = spots.map((spot) => spot.name);
      const notFoundSpotsName = dto.spots.filter(
        (spotName) => !foundSpotsName.includes(spotName),
      );
      throw new HttpException(
        `Spots not exists ${notFoundSpotsName.join(', ')}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const alreadyReserved = spots
      .filter((spot) => spot.status === SpotStatus.reserved)
      .map((spot) => spot.name);

    if (alreadyReserved.length > 0) {
      throw new HttpException(
        `Spots ${alreadyReserved.join(', ')} is not available for reservation `,
        HttpStatus.BAD_REQUEST,
      );
    }
    const tickets = await this.prismaService.$transaction(
      async (prisma) => {
        await prisma.reservationHistory.createMany({
          data: spots.map((spot) => ({
            spotId: spot.id,
            ticketKind: dto.ticket_kind,
            email: dto.email,
            status: TicketStatus.reserved,
          })),
        });

        await prisma.spot.updateMany({
          where: {
            id: {
              in: spots.map((spot) => spot.id),
            },
          },
          data: {
            status: SpotStatus.reserved,
          },
        });

        const tickets = await Promise.all(
          spots.map((spot) =>
            prisma.ticket.create({
              data: {
                email: dto.email,
                ticketKind: dto.ticket_kind,
                spotId: spot.id,
              },
            }),
          ),
        );
        return tickets;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
    return tickets;
  }
}
