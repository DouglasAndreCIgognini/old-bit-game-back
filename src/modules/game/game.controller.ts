import { Controller, Get, Query } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  async getAllGames(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('orderBy') orderBy: string = 'title',
  ) {
    return this.gameService.getAllGames({
      page: Number(page),
      limit: Number(limit),
      orderBy,
    });
  }
}
