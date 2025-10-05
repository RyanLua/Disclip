/**
 * Share command metadata from a common spot to be used for both runtime and registration.
 */

import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
} from 'discord-api-types/v10';

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

/**
 * Silent clip command that sends an ephemeral message.
 * @type {import('discord-api-types/v10').RESTPostAPIApplicationCommandsJSONBody}
 */
export const SILENT_CLIP_COMMAND = {
	name: 'Clip Message (silent)',
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
