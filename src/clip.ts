/**
 * Generates HTML content for a Discord message and then uses Puppeteer to take a screenshot of it.
 */

import puppeteer, {
	type ActiveSession,
	type BrowserWorker,
} from '@cloudflare/puppeteer';
import type { APIMessage } from 'discord-api-types/v10';
import index from '../public/index.html';
import style from '../public/style.css';
import { CLIP_COMPONENT, ERROR_COMPONENT } from './components.ts';

/**
 * Generate a message screenshot from a Discord message.
 * @param message - The Discord message object.
 * @param env - The environment variables.
 * @returns The screenshot image buffer.
 */
async function generateMessageScreenshot(
	message: APIMessage,
	env,
): Promise<Buffer> {
	// Pick random session from open sessions
	let sessionId = await getRandomSession(env.BROWSER);
	let browser;
	if (sessionId) {
		try {
			browser = await puppeteer.connect(env.BROWSER, sessionId);
		} catch (e) {
			// another worker may have connected first
			console.log(`Failed to connect to ${sessionId}. Error ${e}`);
		}
	}
	if (!browser) {
		// No open sessions, launch new session
		browser = await puppeteer.launch(env.BROWSER);
	}

	sessionId = browser.sessionId(); // get current session id

	// Generate the screenshot
	const page = await browser.newPage();
	await page.setContent(index);
	await page.addStyleTag({ content: style });
	await page.addScriptTag({
		url: 'https://cdn.jsdelivr.net/npm/@twemoji/api@latest/dist/twemoji.min.js',
	});

	await page.evaluate((message) => {
		const author = message.author;
		const username = author.global_name || author.username;
		const defaultAvatarIndex = author.discriminator
			? Number(author.discriminator) % 5 // Legacy username system
			: (BigInt(author.id) >> 22n) % 6n; // New username system
		const avatarUrl = author.avatar
			? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.webp`
			: `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
		const serverTag = author.clan?.tag || '';
		const serverTagBadge = author.clan
			? `https://cdn.discordapp.com/guild-tag-badges/${author.clan.identity_guild_id}/${author.clan.badge}.webp`
			: '';
		const botTag = author.bot;

		// TODO: Move this parsing to a separate function/module
		// Parse message content and replace markdown with HTML
		const messageContent = message.content
			.replace(
				/<a?:([^:>]+):(\d+)>/g,
				'<img src="https://cdn.discordapp.com/emojis/$2.webp" alt="$1" class="emoji">',
			) // custom emojis
			.replace(/^### (.+)$/gm, '<h3>$1</h3>') // ### header 3
			.replace(/^## (.+)$/gm, '<h2>$1</h2>') // ## header 2
			.replace(/^# (.+)$/gm, '<h1>$1</h1>') // # header 1
			.replace(/^-# (.+)$/gm, '<small>$1</small>') // -# subtext
			.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>') // > blockquote
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>') // [text](url)
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // **bold**
			.replace(/__(.+?)__/g, '<u>$1</u>') // __underline__
			.replace(/(\*|_)(.+?)\1/g, '<em>$2</em>') // *italic* or _italic_
			.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler">$1</span>') // ||spoiler||
			.replace(/~~(.+?)~~/g, '<del>$1</del>') // ~~strikethrough~~
			.replace(/```([^`]+?)```/g, '<pre>$1</pre>') // ```code block```
			.replace(/`([^`]+)`/g, '<code>$1</code>') // `inline code`
			.replace(/\n/g, '<br>'); // change \n to <br> for line breaks

		document.querySelector('.avatar').setAttribute('src', avatarUrl);

		const usernameElement = document.querySelector('.username');
		usernameElement.firstChild.textContent = username;

		const serverTagElement = document.getElementById('server-tag');
		if (serverTag) {
			serverTagElement.querySelector('span').textContent = serverTag;
			serverTagElement.querySelector('img').setAttribute('src', serverTagBadge);
		} else {
			serverTagElement.style.display = 'none';
		}

		const botTagElement = document.getElementById('bot-tag');
		if (!botTag) {
			botTagElement.style.display = 'none';
		}

		// Set message element
		const messageElement = document.querySelector('.message');
		messageElement.innerHTML = messageContent;

		// Parse message element with Twemoji
		const twemoji = window.twemoji;
		twemoji.parse(messageElement, {
			folder: 'svg',
			ext: '.svg',
		});
	}, message);

	// Wait for images to load
	await page.waitForNetworkIdle();

	// Set the viewport size based on the card element
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
 * @return The session ID or undefined if no sessions are available.
 * @see {@link https://developers.cloudflare.com/browser-rendering/workers-bindings/reuse-sessions/}
 */
async function getRandomSession(
	endpoint: BrowserWorker,
): Promise<string | undefined> {
	const sessions: ActiveSession[] = await puppeteer.sessions(endpoint);
	console.log(`Sessions: ${JSON.stringify(sessions)}`);
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
 * @param interaction - The Discord interaction object.
 * @param env - The environment variables.
 */
export async function generateMessageClip(interaction: APIInteraction, env) {
	const formData = new FormData();
	let msgJson;
	try {
		const targetId = interaction.data.target_id;
		const targetMessage = interaction.data.resolved.messages[targetId];

		const image = await generateMessageScreenshot(targetMessage, env);
		const messageUrl = `https://discord.com/channels/${interaction.guild_id || '@me'}/${targetMessage.channel_id}/${targetMessage.id}`;

		msgJson = CLIP_COMPONENT(messageUrl);

		formData.append('payload_json', JSON.stringify(msgJson));
		formData.append('files[0]', new Blob([image]), 'clip.png');
	} catch (error) {
		console.error('Error generating message clip:', error);

		msgJson = ERROR_COMPONENT(error.stack || 'Unknown error occurred');

		formData.append('payload_json', JSON.stringify(msgJson));
	}

	const discordUrl = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}`;
	const discordResponse = await fetch(discordUrl, {
		method: 'POST',
		body: formData,
	});
	if (!discordResponse.ok) {
		console.error('Failed to send followup to discord', discordResponse.status);
		const json = await discordResponse.json();
		console.error({ response: json, msgJson: JSON.stringify(msgJson) });
	}
}
