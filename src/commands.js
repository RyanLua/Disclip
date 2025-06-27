import { ApplicationIntegrationType, InteractionContextType, ApplicationCommandType } from 'discord-api-types/v10';
import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

// Ping command
const PING_COMMAND = {
	name: 'ping',
	type: ApplicationCommandType.ChatInput,
	description: 'Replies with pong',
	integration_types: [
		ApplicationIntegrationType.GuildInstall,
		ApplicationIntegrationType.UserInstall,
	],
	contexts: [
		InteractionContextType.BotDM,
		InteractionContextType.PrivateChannel,
		InteractionContextType.Guild,
	],
};

// Clip command, for guild install only
const CLIP_COMMAND = {
	name: 'clip',
	type: ApplicationCommandType.Message,
	integration_types: [
		ApplicationIntegrationType.GuildInstall,
		ApplicationIntegrationType.UserInstall,
	],
	contexts: [
		InteractionContextType.PrivateChannel,
		InteractionContextType.Guild,
	],
};

const ALL_COMMANDS = [
	PING_COMMAND,
	CLIP_COMMAND,
];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);