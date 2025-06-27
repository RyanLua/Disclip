/**
 * Share command metadata from a common spot to be used for both runtime
 * and registration.
 */

import { ApplicationCommandType, ApplicationIntegrationType, InteractionContextType } from 'discord-api-types/v10';

// Ping command
export const PING_COMMAND = {
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
export const CLIP_COMMAND = {
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