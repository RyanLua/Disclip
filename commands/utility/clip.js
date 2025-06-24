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
		const messageAuthor = interaction.targetMessage.author;

		await interaction.reply({
			content: [
				`**User:** ${messageAuthor.globalName}`,
				`**Avatar:** ${messageAuthor.avatarURL()}`,
				'**Message:**',
				`${interaction.targetMessage.content}`,
			].join('\n'),
		});
	},
};