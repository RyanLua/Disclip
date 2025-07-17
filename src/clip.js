/**
 * Generates HTML content for a Discord message and then uses Puppeteer to take a screenshot of it.
 */

import puppeteer from '@cloudflare/puppeteer';
import { ComponentType, MessageFlags } from 'discord-api-types/v10';
import template from '../public/index.html';
import css from '../public/style.css';

/**
 * Generate a message screenshot from a Discord message.
 * @param {import('discord-api-types/v10').APIMessage} message - The Discord message object.
 * @param {*} env - The environment variables.
 * @returns {Promise<Buffer>} - The screenshot image buffer.
 */
async function generateMessageScreenshot(message, env) {
	// Pick random session from open sessions
	let sessionId = await getRandomSession(env.BROWSER);
	let browser;
	if (sessionId) {
		try {
			browser = await puppeteer.connect(env.BROWSER, sessionId);
		} catch (sessionError) {
			// another worker may have connected first
			console.warn(`Failed to connect to ${sessionId}. Error ${sessionError}`);
		}
	}
	if (!browser) {
		try {
			// No open sessions, launch new session
			browser = await puppeteer.launch(env.BROWSER);
		} catch (browserError) {
			console.error('Browser launch failed:', browserError);
			throw browserError;
		}
	}

	sessionId = browser.sessionId(); // get current session id

	// Generate the screenshot
	const page = await browser.newPage();

	// Combine HTML template with CSS
	const htmlWithCss = template.replace(
		'</head>',
		`<style>${css}</style></head>`,
	);
	await page.setContent(htmlWithCss);

	const cardElement = await page.$('.card');
	const cardBoundingBox = await cardElement.boundingBox();

	await page.setViewport({
		width: Math.ceil(cardBoundingBox.width + 200),
		height: Math.ceil(cardBoundingBox.height + 200),
		deviceScaleFactor: 2,
	});

	const screenshot = await page.screenshot({
		optimizeForSpeed: true,
	});

	// All work done, so free connection (IMPORTANT!)
	browser.disconnect();

	return screenshot;
}

/**
 * Get a random session ID from the available sessions.
 * @param {import("@cloudflare/puppeteer").BrowserWorker} endpoint
 * @return {Promise<string|undefined>} - The session ID or undefined if no sessions are available.
 * @see {@link https://developers.cloudflare.com/browser-rendering/workers-bindings/reuse-sessions/}
 */
async function getRandomSession(endpoint) {
	const sessions = await puppeteer.sessions(endpoint);
	const sessionsIds = sessions
		.filter((v) => {
			return !v.connectionId; // remove sessions with workers connected to them
		})
		.map((v) => {
			return v.sessionId;
		});
	if (sessionsIds.length === 0) {
		return;
	}

	const sessionId = sessionsIds[Math.floor(Math.random() * sessionsIds.length)];

	return sessionId;
}

/**
 * Generate a message clip from a Discord interaction.
 * @param {import('discord-api-types/v10').APIInteraction} interaction - The Discord interaction object.
 * @param {*} env - The environment variables.
 */
export async function generateMessageClip(interaction, env) {
	let formData;
	let msgJson;
	try {
		const targetId = interaction.data.target_id;
		const targetMessage = interaction.data.resolved.messages[targetId];
		const image = await generateMessageScreenshot(targetMessage, env);
		const messageUrl = `https://discord.com/channels/${interaction.guild_id || '@me'}/${targetMessage.channel_id}/${targetMessage.id}`;

		const attachments = [
			{
				id: 0,
				filename: 'clip.png',
			},
		];
		msgJson = {
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
			attachments,
		};

		formData = new FormData();
		formData.append('payload_json', JSON.stringify(msgJson));
		formData.append('files[0]', new Blob([image]), 'clip.png');
	} catch (error) {
		console.error('Error generating message clip:', error);

		msgJson = {
			content: `Failed to clip message:\`\`\`${error.stack}\`\`\``,
			flags: MessageFlags.Ephemeral,
		};

		formData = new FormData();
		formData.append('payload_json', JSON.stringify(msgJson));
	} finally {
		const discordUrl = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}`;
		const discordResponse = await fetch(discordUrl, {
			method: 'POST',
			body: formData,
		});
		if (!discordResponse.ok) {
			console.error(
				'Failed to send followup to discord',
				discordResponse.status,
			);
			const json = await discordResponse.json();
			console.error({ response: json, msgJson: JSON.stringify(msgJson) });
		}
	}
}
