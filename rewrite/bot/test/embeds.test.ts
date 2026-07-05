import assert from 'node:assert';
import { buildProfileEmbed, buildNotFoundEmbed } from '../src/embeds.js';
import type { PlayerDoc } from '../src/db.js';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`OK   ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

test('buildProfileEmbed форматирует статы игрока', () => {
  const player: PlayerDoc = {
    id: 123456789,
    nickname: '1aur3nt',
    region: 'eu',
    battles: 4213,
    winrate: 58.7123,
    avg_damage: 2140.4,
  };
  const embed = buildProfileEmbed(player).toJSON();

  assert.strictEqual(embed.title, '1aur3nt');
  assert.strictEqual(embed.description, 'region: EU');
  assert.strictEqual(embed.fields?.[0].value, '58.7%');
  assert.strictEqual(embed.fields?.[1].value, '2140');
  assert.strictEqual(embed.fields?.[2].value, '4213');
});

test('buildProfileEmbed переживает отсутствующие поля', () => {
  const player: PlayerDoc = { id: 1 };
  const embed = buildProfileEmbed(player).toJSON();

  assert.strictEqual(embed.title, 'Без ника');
  assert.strictEqual(embed.fields?.[0].value, '0.0%');
});

test('buildNotFoundEmbed отдаёт заголовок про отсутствие игрока', () => {
  const embed = buildNotFoundEmbed().toJSON();
  assert.strictEqual(embed.title, 'Игрок не найден');
});
