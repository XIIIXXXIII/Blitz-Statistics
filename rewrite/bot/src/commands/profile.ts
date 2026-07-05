import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getPlayer } from '../db.js';
import { buildProfileEmbed, buildNotFoundEmbed } from '../embeds.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Статистика профиля (упрощённый порт cogs/profile.py)');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  const player = await getPlayer(Number(interaction.user.id));

  if (!player) {
    await interaction.editReply({ embeds: [buildNotFoundEmbed()] });
    return;
  }

  await interaction.editReply({ embeds: [buildProfileEmbed(player)] });
}
