const { SlashCommandBuilder, MessageFlags, InteractionContextType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!')
		.setContexts([
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
			InteractionContextType.Guild,
		]),
	async execute(interaction) {
		await interaction.reply({
			content: 'Pong!',
			flags: MessageFlags.Ephemeral,
		});
	},
};