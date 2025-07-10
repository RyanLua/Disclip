// @ts-check

/**
 * Share command metadata from a common spot to be used for both runtime and registration.
 */

import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
} from 'discord-api-types/v10';

/**
 * Ping command to check if the bot is online.
 * @type {import('discord-api-types/v10').RESTPostAPIApplicationCommandsJSONBody}
 */
export const PING_COMMAND = {
	name: 'ping',
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
	type: ApplicationCommandType.ChatInput,
};

/**
 * Clip command to create a clip from a message.
 * @type {import('discord-api-types/v10').RESTPostAPIApplicationCommandsJSONBody}
 */
export const CLIP_COMMAND = {
	name: 'Clip Message',
	integration_types: [
		ApplicationIntegrationType.GuildInstall,
		ApplicationIntegrationType.UserInstall,
	],
	contexts: [
		InteractionContextType.PrivateChannel,
		InteractionContextType.Guild,
	],
	type: ApplicationCommandType.Message,
};
