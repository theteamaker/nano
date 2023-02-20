import * as discord from 'discord.js';

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName('op')
        .setDescription('op'),
    async execute(interaction: discord.ChatInputCommandInteraction) {
        await interaction.reply('op');
    },
};