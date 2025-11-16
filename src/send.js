/**
 * Utility to send a raw JSON message body to a Discord channel using the Bot token.
 * Intended for one-off administrative tasks (e.g., posting server rules components).
 */

import process from 'node:process';

/**
 * Send a message to a Discord channel.
 * @param {string} token - Bot token (without the "Bot " prefix)
 * @param {string} channelId - Target channel ID
 * @param {object} body - Raw JSON body matching Discord's channel message create schema
 * @returns {Promise<Response>} Fetch response
 */
export async function sendChannelMessage(token, channelId, body) {
	if (!token) {
		throw new Error('Bot token is required');
	}
	if (!channelId) {
		throw new Error('Channel ID is required');
	}
	const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bot ${token}`,
		},
		body: JSON.stringify(body),
	});
	return response;
}

/**
 * Helper to read env vars when running via node script.
 */
export function getEnv() {
	return {
		token: process.env.DISCORD_TOKEN,
		channelId: process.env.RULES_CHANNEL_ID,
	};
}
