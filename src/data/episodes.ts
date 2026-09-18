import { Episode } from '../types';
import { sohoCafeEpisode } from './episodes/sohoCafe';
import { eastVillageEpisode } from './episodes/eastVillageRoommate';
import { manhattanOfficeEpisode } from './episodes/manhattanOffice';
import { jfkImmigrationEpisode } from './episodes/jfkImmigration';
import { foreignBuyerEpisode } from './episodes/foreignBuyer';

export const EPISODES: Episode[] = [
  sohoCafeEpisode,
  eastVillageEpisode,
  manhattanOfficeEpisode,
  foreignBuyerEpisode,
  jfkImmigrationEpisode,
];
