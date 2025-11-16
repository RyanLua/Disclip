/**
 * One-off script to publish server rules components to a specific channel.
 * Usage: ensure .dev.vars (or environment) has DISCORD_TOKEN and RULES_CHANNEL_ID then run:
 *   node src/publish-rules.js
 */

import dotenv from 'dotenv';
import process from 'node:process';
import { sendChannelMessage, getEnv } from './send.js';

// Load local dev vars (same pattern as register.js)
dotenv.config({ path: '.dev.vars' });

const { token, channelId } = getEnv();

if (!token) {
	throw new Error('DISCORD_TOKEN is required');
}
if (!channelId) {
	throw new Error('RULES_CHANNEL_ID is required');
}

// Original JSON provided by user. Uses components v2 (flags: 32768).
// You can edit the rule text below before publishing.
const RULES_MESSAGE = {
	flags: 32768, // MessageFlags.IsComponentsV2
	components: [
		{
			type: 17, // Container
			accent_color: null,
			components: [
				{ type: 10, content: '# Server Rules' },
				{
					type: 10,
					content:
						'1. Treat everyone with respect. Absolutely no harassment, witch hunting, sexism, racism, or hate speech will be tolerated.',
				},
				{ type: 14, divider: true, spacing: 1 },
				{
					type: 10,
					content:
						'2. No spam or self-promotion (server invites, advertisements, etc) without permission from a staff member. This includes DMing fellow members.',
				},
				{ type: 14 },
				{
					type: 10,
					content:
						'3. No age-restricted or obscene content. This includes text, images, or links featuring nudity, sex, hard violence, or other graphically disturbing content.',
				},
				{ type: 14 },
				{
					type: 10,
					content:
						'4. If you see something against the rules or something that makes you feel unsafe, let staff know. We want this server to be a welcoming space!',
				},
			],
		},
	],
};

async function main() {
	console.log('Publishing rules message...');
	const response = await sendChannelMessage(token, channelId, RULES_MESSAGE);
	if (!response.ok) {
		console.error('Failed to publish rules:', response.status, response.statusText);
		try {
			const error = await response.text();
			console.error(error);
		} catch {}
		process.exit(1);
	}
	const data = await response.json();
	console.log('Rules message published successfully. Message ID:', data.id);
}

main().catch((err) => {
	console.error('Unexpected error publishing rules:', err);
	process.exit(1);
});
