import {
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
	type RESTPostAPIApplicationCommandsJSONBody,
} from 'discord-api-types/v10';

/**
 * Clip command to create a clip from a message.
 */
export const CLIP_COMMAND: RESTPostAPIApplicationCommandsJSONBody = {
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
 */
export const SILENT_CLIP_COMMAND: RESTPostAPIApplicationCommandsJSONBody = {
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
