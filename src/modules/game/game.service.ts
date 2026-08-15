import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameResponseDto } from '../../dtos/game';
import { getGameDomainUrl } from '../../utils/url';
import { Response } from 'express';
import { GameWhereInput } from '../../generated/prisma/models';

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllGames({
    page = 1,
    limit = 10,
    orderBy = 'title',
    order = 'asc',
    q = '',
    platform = '',
  }: {
    page?: number;
    limit?: number;
    orderBy?: string;
    order?: string;
    q?: string;
    platform?: string;
  }): Promise<GameResponseDto> {
    const skip = (page - 1) * limit;

    const where: GameWhereInput = {
      title: {
        contains: q,
        mode: 'insensitive',
      },
      platform: {
        contains: platform,
        mode: 'insensitive',
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.game.findMany({
        skip,
        take: limit,
        orderBy: {
          [orderBy]: order,
        },
        where,
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
      this.prisma.game.count({ where }),
    ]);

    if (!data || data.length === 0) {
      throw new NotFoundException('No games found');
    }

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

  async getGameById(id: number) {
    try {
      const game = await this.prisma.game.findUnique({
        where: { id },
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
      });

      if (!game) {
        throw new NotFoundException('Game not found');
      }

      return game;
    } catch (err: any) {
      console.error(err);
      throw new HttpException('Internal Error', 500);
    }
  }

  async getPlayGameById(id: number, res: Response) {
    try {
      const { link, played_count } = await this.getGameById(id);

      const response = await fetch(link, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Referer: getGameDomainUrl(link),
        },
      });

      if (!response.ok) {
        throw new HttpException('Error to load ROM', response.status);
      }

      res.setHeader(
        'Content-Type',
        response.headers.get('content-type') || 'application/zip',
      );

      await this.prisma.game.update({
        where: {
          id,
        },
        data: {
          played_count: Number(played_count + 1),
        },
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (err: any) {
      console.error(err);
      throw new HttpException('Internal Error', 500);
    }
  }
}
