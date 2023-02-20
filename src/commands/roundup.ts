import * as discord from 'discord.js';

module.exports = {
    data: new discord.SlashCommandBuilder()
        .setName('roundup')
        .setDescription('Provides a concise summary of the rips currently in pins.'),
    async execute(interaction: discord.ChatInputCommandInteraction) {
        roundup(interaction);
    },
};

// class PinnedRip {
//     byline: string;
//     title: string;
//     content: string;
//     id: string;
//     reactions: string;
//     link: string;
//     constructor(byline: string, title: string, content: string, id: string, reactions: string, link:string) {
//         this.byline = byline;
//         this.title = title;
//         this.content = content;
//         this.id = id;
//         this.reactions = reactions;
//         this.link = link;
//     }
// }

async function roundup(interaction: discord.ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.guild || !interaction.channel) {
        return;
    }


    // to be filled by OEM lol


    await interaction.editReply('meow');
}