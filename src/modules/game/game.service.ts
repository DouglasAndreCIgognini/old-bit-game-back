import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameResponseDto } from '../../dtos/game';

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllGames({
    page = 1,
    limit = 10,
    orderBy = 'title',
  }: {
    page?: number;
    limit?: number;
    orderBy?: string;
  }): Promise<GameResponseDto> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.game.findMany({
        skip,
        take: limit,
        orderBy: {
          [orderBy]: 'asc',
        },
        include: {
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.game.count(),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
