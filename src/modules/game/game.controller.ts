import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { GameService } from './game.service';
import type { Response } from 'express';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  async getAllGames(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('orderBy') orderBy: string = 'title',
    @Query('order') order: string = 'asc',
    @Query('q') q: string = '',
    @Query('platform') platform: string = '',
  ) {
    return this.gameService.getAllGames({
      page: Number(page),
      limit: Number(limit),
      orderBy,
      order,
      q,
      platform,
    });
  }

  @Get(':id')
  async getGameById(@Param('id') id: number) {
    return this.gameService.getGameById(Number(id));
  }

  @Get(':id/play')
  async getPlayGameById(@Param('id') id: number, @Res() res: Response) {
    const buffer = await this.gameService.getPlayGameById(Number(id), res);
    return res.send(buffer);
  }
}
