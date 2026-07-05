import { MongoClient, Collection } from 'mongodb';
import { config } from './config.js';

export interface PlayerDoc {
  id: number; // Discord user id — та же схема ключа, что и в оригинале (players.py: create_index_for_id)
  nickname?: string;
  region?: string;
  battles?: number;
  winrate?: number;
  avg_damage?: number;
}

const client = new MongoClient(config.mongodbUri);
let playersCollection: Collection<PlayerDoc> | null = null;

export async function connectDb(): Promise<void> {
  await client.connect();
  playersCollection = client.db().collection<PlayerDoc>('players');
  console.log('MongoDB: подключено');
}

export async function getPlayer(discordId: number): Promise<PlayerDoc | null> {
  if (!playersCollection) {
    throw new Error('connectDb() ещё не вызван');
  }
  return playersCollection.findOne({ id: discordId });
}

export async function closeDb(): Promise<void> {
  await client.close();
}
