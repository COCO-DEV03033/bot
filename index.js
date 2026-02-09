require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN missing in .env");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const cmd = require(path.join(commandsPath, file));
  if (!cmd?.name || !cmd?.execute) {
    console.warn(`⚠️ Skipping ${file} (missing name/execute)`);
    continue;
  }
  client.commands.set(cmd.name, cmd);
  console.log(`✅ Loaded command module: ${cmd.name}`);
}

client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      return interaction.reply({ content: "❌ Unknown command.", ephemeral: true });
    }

    await command.execute(interaction);
  } catch (err) {
    console.error("Command error:", err);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: "❌ Error executing command." });
      } else {
        await interaction.reply({ content: "❌ Error executing command.", ephemeral: true });
      }
    } catch {}
  }
});

client.login(process.env.DISCORD_TOKEN);
client.once("ready", () => console.log(`🤖 Logged in as ${client.user.tag}`));
