import {
	ButtonStyle,
	ComponentType,
	MessageFlags,
} from 'discord-api-types/v10';

/**
 * @param {string} errorStacktrace - The error stacktrace to display
 * @returns {import('discord-api-types/v10').RESTPostAPIWebhookWithTokenJSONBody}
 */
export const msgJsonTemplate = (errorStacktrace) => ({
	flags: MessageFlags.IsComponentsV2,
	components: [
		{
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.Section,
					components: [
						{
							type: ComponentType.TextDisplay,
							content: `## Error\n\nUnknown error occurred:\n\n\`\`\`\n${errorStacktrace}\n\`\`\``,
						},
					],
					accessory: {
						type: ComponentType.Button,
						style: ButtonStyle.Link,
						label: 'Support Server',
						url: 'https://discord.com/invite/KYcCPPjF',
					},
				},
			],
		},
	],
});
