import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Проверка, что бот на связи');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const start = Date.now();
  await interaction.reply('Pong!');
  const latency = Date.now() - start;
  await interaction.editReply(`Pong! (${latency}ms)`);
}
