const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

const data = new ContextMenuCommandBuilder()
	.setName('User Information')
	.setType(ApplicationCommandType.Message);

