const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('Clip Message')
		.setType(ApplicationCommandType.Message),
	async execute(interaction) {
		await console.log(interaction);
	},
};