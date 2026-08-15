import battlefield from '../assets/stages/battlefield.jpg';
import smallBattlefield from '../assets/stages/small_battlefield.jpg';
import finalDestination from '../assets/stages/final_destination.jpg';
import townAndCity from '../assets/stages/town_and_city.jpg';
import smashville from '../assets/stages/smashville.jpg';
import pokemonStadium2 from '../assets/stages/pokemon_stadium_2.jpg';
import kalosLeague from '../assets/stages/kalos_league.jpg';
import hollowBastion from '../assets/stages/hollow_bastion.jpg';

import type { ImageMetadata } from 'astro';

export type StageCategory = 'starter' | 'counterpick';

export interface Stage {
  id: string;
  name: string;
  image: ImageMetadata;
  category: StageCategory;
}

export const DEFAULT_STAGES: Stage[] = [
  { id: 'battlefield', name: 'Battlefield', image: battlefield, category: 'starter' },
  { id: 'small_battlefield', name: 'Small Battlefield', image: smallBattlefield, category: 'starter' },
  { id: 'final_destination', name: 'Final Destination', image: finalDestination, category: 'counterpick' },
  { id: 'town_and_city', name: 'Town and City', image: townAndCity, category: 'starter' },
  { id: 'smashville', name: 'Smashville', image: smashville, category: 'starter' },
  { id: 'pokemon_stadium_2', name: 'Pokémon Stadium 2', image: pokemonStadium2, category: 'starter' },
  { id: 'kalos_league', name: 'Kalos Pokémon League', image: kalosLeague, category: 'counterpick' },
  { id: 'hollow_bastion', name: 'Hollow Bastion', image: hollowBastion, category: 'counterpick' },
];
