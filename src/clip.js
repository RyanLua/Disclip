/**
 * Generates HTML content for a Discord message and then uses Puppeteer to take a screenshot of it.
 */

import puppeteer from '@cloudflare/puppeteer';
import { ComponentType, MessageFlags } from 'discord-api-types/v10';

/**
 * Generates HTML content for a Discord message.
 * @param {import('discord-api-types/v10').APIMessage} message - The Discord message object.
 * @returns {string} - The generated HTML content.
 */
function generateHtml(message) {
	const author = message.author;
	const username = author.username;
	const avatarUrl = `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png`;
	const serverTag = author.clan?.tag || '';
	const serverTagBadge = author.clan
		? `https://cdn.discordapp.com/guild-tag-badges/${author.clan.identity_guild_id}/${author.clan.badge}.png`
		: '';
	const messageContent = message.content;

	// TODO: Use file later, don't hard code
	const htmlTemplate = `<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<style>
			@font-face {
				font-family: "gg sans";
				src: url("fonts/ggsansvf-VF.woff2") format("woff2-variations");
				font-weight: 125 950;
				font-stretch: 75% 125%;

				font-style: normal;
			}

			:root {
				--username-color: light-dark(rgb(50, 51, 56), rgb(255, 255, 255));
				--message-color: light-dark(rgb(47, 48, 53), rgb(223, 224, 226));
				--tag-background-color: rgba(151, 151, 159, 0.2);
				--card-background-color: light-dark(rgb(255, 255, 255), rgb(57, 58, 65));
				--card-border: 1px solid light-dark(rgb(226, 226, 228), rgb(68, 69, 76));
				--card-shadow: 0 12px 36px 0 hsl(none 0% 0% / 0.12);

				--color-blurple: rgb(88, 101, 242);
				--color-light-blurple: rgb(224, 227, 255);
				--color-dark-blurple: rgb(25, 23, 92);

				--font-weight-medium: 500;
				--font-weight-semibold: 600;

				--radius-xs: 4px;
				--radius-sm: 8px;
				--radius-round: 2147483647px;

				--space-xxs: 4px;
				--space-sm: 16px;

				color-scheme: dark;
			}

			html {
				display: flex;
				align-items: center;
				justify-content: center;
				height: 100%;
				font-family:
					"gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
				background: radial-gradient(
					105.43% 127.05% at 50.1% 127.05%,
					var(--color-blurple) 20.65%,
					var(--color-dark-blurple) 85.16%
				);
			}

			.card {
				display: flex;
				gap: var(--space-sm);
				max-width: 400px;
				padding: var(--space-sm);
				word-break: break-word;
				background-color: var(--card-background-color);
				border: var(--card-border);
				border-radius: var(--radius-sm);
				/* box-shadow: var(--card-shadow); */
			}

			.avatar {
				width: 40px;
				height: 40px;
				border-radius: var(--radius-round);
			}

			.username {
				display: flex;
				flex-wrap: wrap;
				gap: var(--space-xxs);
				align-items: center;
				font-weight: var(--font-weight-medium);
				color: var(--username-color);
			
				& > * {
					font-size: 0.75rem;
				}
			}

			.tag {
				display: flex;
				gap: var(--space-xxs);
				align-items: center;
				padding: 0 var(--space-xxs);
				font-weight: var(--font-weight-semibold);
				background-color: var(--tag-background-color);
				border-radius: var(--radius-xs);

				& img {
					width: 12px;
					height: 12px;
				}

				& img[src=""] {
					display: none;
				}
			}

			.message {
				color: var(--message-color);
			}
		</style>
	</head>

	<body>
		<div class="card">
			<img class="avatar" alt="User avatar" src="${avatarUrl}" />
			<div>
				<div class="username">
					${username}
					<span class="tag">
						<img src="${serverTagBadge}" alt="User server tag">
						<span>${serverTag}</span>
					</span>
				</div>
				<span class="message">${messageContent}</span>
			</div>
		</div>
	</body>
</html>`;

	return htmlTemplate;
}

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
	const html = generateHtml(message);
	await page.setContent(html);

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
