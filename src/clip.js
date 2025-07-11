/**
 * Generates HTML content for a Discord message and then uses Puppeteer to take a screenshot of it.
 */

import puppeteer from '@cloudflare/puppeteer';

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
				box-shadow: var(--card-shadow);
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
	let browser;
	try {
		browser = await puppeteer.launch(env.BROWSER);
		const page = await browser.newPage();

		const html = generateHtml(message);

		await page.setContent(html);

		const screenshot = await page.screenshot({
			optimizeForSpeed: true,
		});

		await browser.close();

		return screenshot;
	} catch (screenshotError) {
		console.error(`Screenshot generation failed:`, screenshotError);
		console.error(`Screenshot error type: ${screenshotError.constructor.name}`);
		throw screenshotError;
	}
}

/**
 * Generate a message clip from a Discord interaction.
 * @param {import('discord-api-types/v10').APIInteraction} interaction - The Discord interaction object.
 * @param {*} env - The environment variables.
 */
export async function generateMessageClip(interaction, env) {
	const targetId = interaction.data.target_id;
	const targetMessage = interaction.data.resolved.messages[targetId];
	const image = await generateMessageScreenshot(targetMessage, env);

	const attachments = [
		{
			id: 0,
			filename: 'clip.png',
		},
	];
	const msgJson = {
		attachments,
	};

	const formData = new FormData();
	formData.append('payload_json', JSON.stringify(msgJson));
	formData.append('files[0]', new Blob([image]), 'clip.png');

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
