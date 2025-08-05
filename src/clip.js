/**
 * Generates HTML content for a Discord message and then uses Puppeteer to take a screenshot of it.
 */

import puppeteer from '@cloudflare/puppeteer';
import index from '../public/index.html';
import style from '../public/style.css';
import { CLIP_COMPONENT, ERROR_COMPONENT } from './components.js';

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
	await page.setContent(index, { waitUntil: 'networkidle0' });
	await page.addStyleTag({ content: style });

	console.log(JSON.stringify(message));

	await page.evaluate((message) => {
		// Function to convert markdown formatting to HTML
		function parseMarkdown(text) {
			return (
				text
					// change \n to <br> for line breaks
					.replace(/\n/g, '<br>')
					// **bold**
					.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
					// __underline__
					.replace(/__(.*?)__/g, '<u>$1</u>')
					// *italic*
					.replace(/\*([^*]+?)\*/g, '<em>$1</em>')
					// _italic_
					.replace(/\b_([^_]+?)_\b/g, '<em>$1</em>')
					// ||spoiler||
					.replace(/\|\|([^|]+?)\|\|/g, '<span class="spoiler">$1</span>')
					// ~~strikethrough~~
					.replace(/~~(.*?)~~/g, '<del>$1</del>')
					// ```code block```
					.replace(/```([^`]+?)```/g, '<pre>$1</pre>')
					// `code`
					.replace(/`([^`]+?)`/g, '<code>$1</code>')
			);
		}

		const author = message.author;
		const username = author.global_name || author.username;
		const defaultAvatarIndex = author.discriminator
			? Number(author.discriminator) % 5 // Legacy username system
			: (BigInt(author.id) >> 22n) % 6n; // New username system
		const avatarUrl = author.avatar
			? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png`
			: `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
		const serverTag = author.clan?.tag || '';
		const serverTagBadge = author.clan
			? `https://cdn.discordapp.com/guild-tag-badges/${author.clan.identity_guild_id}/${author.clan.badge}.png`
			: '';
		const messageContent = parseMarkdown(message.content);

		document.querySelector('.avatar').setAttribute('src', avatarUrl);

		const usernameElement = document.querySelector('.username');
		usernameElement.firstChild.textContent = username;

		const tagElement = document.querySelector('.username .tag');
		tagElement.querySelector('span').textContent = serverTag;
		tagElement.querySelector('img').setAttribute('src', serverTagBadge);

		document.querySelector('.message').innerHTML = messageContent;
	}, message);

	const cardElement = await page.$('.card');
	const cardBoundingBox = await cardElement.boundingBox();

	await page.setViewport({
		width: cardBoundingBox.width + 200,
		height: cardBoundingBox.height + 200,
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
 * @todo Fix this when developing locally, where it will error because it can't get sessions while local.
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

		msgJson = CLIP_COMPONENT(messageUrl);

		formData = new FormData();
		formData.append('payload_json', JSON.stringify(msgJson));
		formData.append('files[0]', new Blob([image]), 'clip.png');
	} catch (error) {
		console.error('Error generating message clip:', error);

		msgJson = ERROR_COMPONENT(error.stack || 'Unknown error occurred');

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
			console.error({
				response: json,
				msgJson: JSON.stringify(msgJson),
			});
		}
	}
}
