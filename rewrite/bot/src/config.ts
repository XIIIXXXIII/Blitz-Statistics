import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Отсутствует переменная окружения ${name} (см. .env.example)`);
  }
  return value;
}

export const config = {
  discordToken: required('DISCORD_TOKEN'),
  // Те же имена переменных, что в lib/settings/settings.py::EnvConfig у Python-версии —
  // это позволяет держать один .env на все сервисы, если понадобится.
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017',
};
