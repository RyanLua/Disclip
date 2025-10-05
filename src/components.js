import {
	ButtonStyle,
	ComponentType,
	MessageFlags,
} from 'discord-api-types/v10';

/**
 * Component for clipping a message.
 * @param {string} messageUrl - URL of the Discord message
 * @returns {import('discord-api-types/v10').RESTPostAPIWebhookWithTokenJSONBody}
 */
export const CLIP_COMPONENT = (messageUrl) => ({
	flags: MessageFlags.IsComponentsV2,
	components: [
		{
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: `## Clipped Message\n\nOriginal message from ${messageUrl}`,
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
				{
					type: ComponentType.ActionRow,
					components: [
						{
							style: ButtonStyle.Secondary,
							type: ComponentType.Button,
							custom_id: 'save_clip',
							label: 'Save to DMs',
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

/**
 * Component for displaying an error message.
 * @param {string} errorStacktrace - The error stacktrace to display
 * @returns {import('discord-api-types/v10').RESTPostAPIWebhookWithTokenJSONBody}
 */
export const ERROR_COMPONENT = (errorStacktrace) => ({
	flags: MessageFlags.IsComponentsV2,
	components: [
		{
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: `## Error\n\nUnknown error occurred\n\`\`\`\n${errorStacktrace}\n\`\`\``,
				},
				{
					type: ComponentType.ActionRow,
					components: [
						{
							type: ComponentType.Button,
							style: ButtonStyle.Link,
							label: 'Support Server',
							url: 'https://discord.gg/XkAHS8MkTe',
						},
					],
				},
			],
		},
	],
});
