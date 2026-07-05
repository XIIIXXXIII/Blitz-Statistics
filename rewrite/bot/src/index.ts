import { Client, GatewayIntentBits, Collection, REST, Routes, ChatInputCommandInteraction } from 'discord.js';
import { config } from './config.js';
import { connectDb } from './db.js';
import * as ping from './commands/ping.js';
import * as profile from './commands/profile.js';

interface Command {
  data: { name: string; toJSON: () => unknown };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commands: Collection<string, Command> = new Collection();
for (const cmd of [ping, profile] as Command[]) {
  commands.set(cmd.data.name, cmd);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Вошёл как ${client.user?.tag}`);

  const rest = new REST().setToken(config.discordToken);
  await rest.put(Routes.applicationCommands(client.user!.id), {
    body: [...commands.values()].map((c) => c.data.toJSON()),
  });
  console.log(`Зарегистрировано команд: ${commands.size}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Ошибка в команде ${interaction.commandName}:`, err);
    const payload = { content: 'Что-то сломалось при выполнении команды.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
});

async function main(): Promise<void> {
  await connectDb();
  await client.login(config.discordToken);
}

main().catch((err) => {
  console.error('Фатальная ошибка при запуске:', err);
  process.exit(1);
});
