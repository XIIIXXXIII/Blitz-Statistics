import { EmbedBuilder } from 'discord.js';
import type { PlayerDoc } from './db.js';

export function buildProfileEmbed(player: PlayerDoc): EmbedBuilder {
  const winrate = player.winrate ?? 0;
  const avgDamage = player.avg_damage ?? 0;
  const battles = player.battles ?? 0;

  return new EmbedBuilder()
    .setTitle(player.nickname ?? 'Без ника')
    .setDescription(`region: ${(player.region ?? 'unknown').toUpperCase()}`)
    .addFields(
      { name: 'Winrate', value: `${winrate.toFixed(1)}%`, inline: true },
      { name: 'Avg damage', value: `${Math.round(avgDamage)}`, inline: true },
      { name: 'Battles', value: `${battles}`, inline: true },
    )
    .setColor(0x2b6cb0);
}

export function buildNotFoundEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('Игрок не найден')
    .setDescription('Аккаунт не привязан. Команда привязки — следующий шаг переноса (см. cogs/set.py в оригинале).')
    .setColor(0xaa3333);
}
