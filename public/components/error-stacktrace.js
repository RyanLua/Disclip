import {
	ButtonStyle,
	ComponentType,
	MessageFlags,
} from 'discord-api-types/v10';

/**
 * @type {import('discord-api-types/v10').RESTPostAPIWebhookWithTokenJSONBody}
 */
export const msgJsonTemplate = {
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
							content:
								'## Error\n\nUnknown error occurred:\n\n```\nSomething unexpected occurred\n```',
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
};
