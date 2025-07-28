import { ComponentType, MessageFlags } from 'discord-api-types/v10';

/**
 * @param {string} messageUrl - URL of the Discord message
 * @returns {import('discord-api-types/v10').RESTPostAPIWebhookWithTokenJSONBody}
 */
export const msgJsonTemplate = (messageUrl) => ({
	flags: MessageFlags.IsComponentsV2,
	components: [
		{
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: `## Successfully Clipped Message\n\nSaved message from ${messageUrl}`,
				},
				{
					type: ComponentType.MediaGallery,
					items: [
						{
							media: {
								url: 'attachment://clip.png',
							},
						},
					],
				},
			],
		},
	],
	attachments: [
		{
			id: 0,
			filename: 'clip.png',
		},
	],
});
