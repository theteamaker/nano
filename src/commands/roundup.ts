import * as discord from 'discord.js';
import * as api from 'discord-api-types/v10';

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

    const guild = interaction.guild;
    const channel = interaction.channel;

    if (!(guild && channel && channel.type === api.ChannelType.GuildText)) {
        return;
    }

    async function fetch() {
        let fetched_pins: Array<discord.Message> = [];
        if (!channel || channel.type != api.ChannelType.GuildText) {
            return fetched_pins;
        }
        
        await channel.messages.fetchPinned(false)
            .then(async (pins) => await pins.forEach(async (msg) => await msg.fetch(false)
            .then(msg => fetched_pins.push(msg))))
        return fetched_pins
    }

    let fetched_pins = await fetch()
    if (fetched_pins.length === 0) {
        await interaction.editReply("Huh... I didn't get anything back. Are there really *no* pins?")
        return
    }
    
    await interaction.editReply(`${fetched_pins[0]}`);
}