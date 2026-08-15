import { CategoryDto } from './category';

interface CategoryGame {
  category: CategoryDto;
}

export interface GameDto {
  id: number;
  title: string;
  link: string;
  platform: string;
  core: string;
  played_count: number;
  description: string | null;
  image_url: string | null;
  categories: CategoryGame[];
  created_at: Date;
  updated_at: Date;
}

export interface GameResponseDto {
  data: GameDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
