// Optional Discord bot starter. This file is not started by the upload panel.
// Add only known, safe bot commands. Do not execute uploaded scripts in the bot process.
import "dotenv/config";
import { Client, GatewayIntentBits, PermissionFlagsBits } from "discord.js";

if (!process.env.DISCORD_TOKEN) {
  throw new Error("Set DISCORD_TOKEN in .env before starting the bot.");
}
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once("ready", () => console.log(`Bot online as ${client.user.tag}`));

client.on("guildMemberAdd", async member => {
  const channel = member.guild.systemChannel;
  if (channel) {
    await channel.send(`Chào mừng ${member} đến với **${member.guild.name}**!`);
  }
});

// Safe example: reacts only to an explicitly configured slash command.
// Register slash commands separately through Discord's official developer docs.
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === "ping") {
    await interaction.reply({ content: "Pong! Bot đang hoạt động.", ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
