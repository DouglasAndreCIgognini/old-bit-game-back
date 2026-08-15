import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameResponseDto } from '../../dtos/game';
import { getGameDomainUrl } from '../../utils/url';
import { Response } from 'express';

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
      const { link } = await this.getGameById(id);

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

      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (err: any) {
      console.error(err);
      throw new HttpException('Internal Error', 500);
    }
  }
}
