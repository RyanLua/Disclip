import {
	ButtonStyle,
	ComponentType,
	MessageFlags,
	type RESTPostAPIWebhookWithTokenJSONBody,
} from 'discord-api-types/v10';

/**
 * Component for clipping a message.
 * @param messageUrl - URL of the Discord message
 */
export const CLIP_COMPONENT = (
	messageUrl: string,
): RESTPostAPIWebhookWithTokenJSONBody => ({
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

/**
 * Component for displaying an error message.
 * @param errorStacktrace - The error stacktrace to display
 */
export const ERROR_COMPONENT = (
	errorStacktrace: string,
): RESTPostAPIWebhookWithTokenJSONBody => ({
	flags: MessageFlags.IsComponentsV2,
	components: [
		{
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: `## Error\n\nUnknown error occurred:\n\`\`\`\n${errorStacktrace}\n\`\`\``,
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
