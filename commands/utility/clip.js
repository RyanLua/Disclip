const { ContextMenuCommandBuilder, ApplicationCommandType, InteractionContextType } = require('discord.js');

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('Clip Message')
		.setType(ApplicationCommandType.Message)
		.setContexts([
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel,
			InteractionContextType.Guild,
		]),
	async execute(interaction) {
		await console.log(interaction);
	},
};