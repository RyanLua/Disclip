/**
 * The core server that runs on a Cloudflare worker.
 */

import {
	InteractionResponseType,
	InteractionType,
	MessageFlags,
} from 'discord-api-types/v10';
import { verifyKey } from 'discord-interactions';
import { AutoRouter } from 'itty-router';
import { generateMessageClip } from './clip.js';
import { CLIP_COMMAND, PING_COMMAND } from './commands.js';

/**
 * @typedef {Object} Env
 * @property {string} DISCORD_PUBLIC_KEY
 * @property {string} DISCORD_APPLICATION_ID
 */

class JsonResponse extends Response {
	constructor(body, init) {
		const jsonBody = JSON.stringify(body);
		init = init || {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		};
		super(jsonBody, init);
	}
}

const router = AutoRouter();

router.get('/', (_request, env) => {
	return new Response(null, {
		status: 301,
		headers: {
			Location: `https://discord.com/oauth2/authorize?client_id=${env.DISCORD_APPLICATION_ID}`,
			'Cache-Control': 'max-age=3600', // Cache for 1 hour
		},
	});
});

router.get('/terms', () => {
	const html = `<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Terms of Service - Disclip</title>
		<link rel="stylesheet" href="style.css">
		<style>
			.document {
				max-width: 800px;
				margin: 40px auto;
				padding: var(--space-xl);
				background-color: var(--card-background-color);
				border: var(--card-border);
				border-radius: var(--radius-lg);
				box-shadow: var(--card-shadow);
				color: var(--message-color);
				line-height: 1.6;
			}
			.document h1 {
				color: var(--username-color);
				font-size: 2rem;
				font-weight: var(--font-weight-bold);
				margin-bottom: var(--space-lg);
				text-align: center;
			}
			.document h2 {
				color: var(--username-color);
				font-size: 1.5rem;
				font-weight: var(--font-weight-semibold);
				margin: var(--space-lg) 0 var(--space-md) 0;
			}
			.document h3 {
				color: var(--username-color);
				font-size: 1.25rem;
				font-weight: var(--font-weight-medium);
				margin: var(--space-md) 0 var(--space-sm) 0;
			}
			.document p {
				margin: var(--space-sm) 0;
			}
			.document ul {
				margin: var(--space-sm) 0;
				padding-left: var(--space-lg);
			}
			.document li {
				margin: var(--space-xxs) 0;
			}
			.document a {
				color: var(--color-blurple);
				text-decoration: none;
			}
			.document a:hover {
				text-decoration: underline;
			}
			.document .effective-date {
				color: var(--timestamp-color);
				font-style: italic;
				text-align: center;
				margin-bottom: var(--space-xl);
			}
		</style>
	</head>

	<body>
		<div class="document">
			<h1>Terms of Service</h1>
			<p class="effective-date">Effective Date: December 18, 2024</p>

			<h2>1. Acceptance of Terms</h2>
			<p>By using Disclip ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.</p>

			<h2>2. Description of Service</h2>
			<p>Disclip is a Discord application that allows users to create high-quality images of Discord messages for sharing purposes. The Service generates screenshots of messages and provides them to users through Discord interactions.</p>

			<h2>3. User Conduct</h2>
			<p>You agree to use the Service responsibly and in compliance with:</p>
			<ul>
				<li>Discord's Terms of Service and Community Guidelines</li>
				<li>All applicable laws and regulations</li>
				<li>These Terms of Service</li>
			</ul>

			<h3>3.1 Prohibited Uses</h3>
			<p>You may not use the Service to:</p>
			<ul>
				<li>Create images of messages without proper authorization from message authors</li>
				<li>Share or distribute content that violates Discord's Community Guidelines</li>
				<li>Attempt to reverse engineer, modify, or interfere with the Service</li>
				<li>Use the Service for illegal activities or to violate others' privacy</li>
			</ul>

			<h2>4. Privacy and Data</h2>
			<p>The Service processes Discord message data to generate images. For detailed information about data handling, please refer to our <a href="/privacy">Privacy Policy</a>.</p>

			<h2>5. Intellectual Property</h2>
			<p>The Service and its original content are owned by the Service provider and are protected by intellectual property laws. Users retain ownership of their original message content.</p>

			<h2>6. Disclaimer of Warranties</h2>
			<p>The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or meet your specific requirements.</p>

			<h2>7. Limitation of Liability</h2>
			<p>To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.</p>

			<h2>8. Termination</h2>
			<p>We reserve the right to terminate or suspend access to the Service at any time, for any reason, without prior notice.</p>

			<h2>9. Changes to Terms</h2>
			<p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>

			<h2>10. Contact Information</h2>
			<p>If you have questions about these Terms, please contact us through our <a href="https://github.com/RyanLua/Disclip/issues">GitHub repository</a>.</p>

			<h2>11. Governing Law</h2>
			<p>These Terms are governed by and construed in accordance with applicable laws, without regard to conflict of law principles.</p>
		</div>
	</body>
</html>`;

	return new Response(html, {
		headers: {
			'content-type': 'text/html;charset=UTF-8',
			'Cache-Control': 'max-age=86400', // Cache for 24 hours
		},
	});
});

router.get('/privacy', () => {
	const html = `<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Privacy Policy - Disclip</title>
		<link rel="stylesheet" href="style.css">
		<style>
			.document {
				max-width: 800px;
				margin: 40px auto;
				padding: var(--space-xl);
				background-color: var(--card-background-color);
				border: var(--card-border);
				border-radius: var(--radius-lg);
				box-shadow: var(--card-shadow);
				color: var(--message-color);
				line-height: 1.6;
			}
			.document h1 {
				color: var(--username-color);
				font-size: 2rem;
				font-weight: var(--font-weight-bold);
				margin-bottom: var(--space-lg);
				text-align: center;
			}
			.document h2 {
				color: var(--username-color);
				font-size: 1.5rem;
				font-weight: var(--font-weight-semibold);
				margin: var(--space-lg) 0 var(--space-md) 0;
			}
			.document h3 {
				color: var(--username-color);
				font-size: 1.25rem;
				font-weight: var(--font-weight-medium);
				margin: var(--space-md) 0 var(--space-sm) 0;
			}
			.document p {
				margin: var(--space-sm) 0;
			}
			.document ul {
				margin: var(--space-sm) 0;
				padding-left: var(--space-lg);
			}
			.document li {
				margin: var(--space-xxs) 0;
			}
			.document a {
				color: var(--color-blurple);
				text-decoration: none;
			}
			.document a:hover {
				text-decoration: underline;
			}
			.document .effective-date {
				color: var(--timestamp-color);
				font-style: italic;
				text-align: center;
				margin-bottom: var(--space-xl);
			}
		</style>
	</head>

	<body>
		<div class="document">
			<h1>Privacy Policy</h1>
			<p class="effective-date">Effective Date: December 18, 2024</p>

			<h2>1. Introduction</h2>
			<p>This Privacy Policy explains how Disclip ("we," "our," or "the Service") collects, uses, and protects information when you use our Discord application.</p>

			<h2>2. Information We Collect</h2>
			
			<h3>2.1 Discord Message Data</h3>
			<p>When you use Disclip to create message images, we temporarily process:</p>
			<ul>
				<li>Message content and metadata</li>
				<li>User display names and avatars</li>
				<li>Server information (when applicable)</li>
				<li>Timestamp information</li>
			</ul>

			<h3>2.2 Usage Information</h3>
			<p>We may collect:</p>
			<ul>
				<li>Discord user IDs for command interactions</li>
				<li>Server IDs where the bot is used</li>
				<li>Basic usage analytics and error logs</li>
			</ul>

			<h2>3. How We Use Information</h2>
			<p>We use the collected information to:</p>
			<ul>
				<li>Generate message screenshot images</li>
				<li>Provide and improve the Service</li>
				<li>Debug and fix technical issues</li>
				<li>Analyze usage patterns to enhance user experience</li>
			</ul>

			<h2>4. Data Processing and Storage</h2>
			
			<h3>4.1 Temporary Processing</h3>
			<p>Message data is processed temporarily to generate images and is not permanently stored. The Service operates on a per-request basis without persistent message storage.</p>

			<h3>4.2 Generated Images</h3>
			<p>Screenshot images created by the Service are delivered directly to Discord and are not stored on our servers.</p>

			<h3>4.3 Cloudflare Workers</h3>
			<p>The Service runs on Cloudflare Workers, which may temporarily cache data according to Cloudflare's privacy practices.</p>

			<h2>5. Data Sharing</h2>
			<p>We do not sell, trade, or share your personal information with third parties, except:</p>
			<ul>
				<li>As required by law or legal process</li>
				<li>To protect our rights and the safety of users</li>
				<li>With service providers necessary for Service operation (e.g., Cloudflare)</li>
			</ul>

			<h2>6. Discord's Role</h2>
			<p>The Service operates within Discord's platform and is subject to Discord's Privacy Policy. Discord controls the delivery and storage of generated images within their platform.</p>

			<h2>7. Data Security</h2>
			<p>We implement appropriate security measures to protect against unauthorized access, alteration, disclosure, or destruction of data. However, no method of transmission over the internet is 100% secure.</p>

			<h2>8. User Rights</h2>
			<p>You have the right to:</p>
			<ul>
				<li>Stop using the Service at any time</li>
				<li>Remove the bot from your servers</li>
				<li>Contact us with privacy-related questions</li>
			</ul>

			<h2>9. Children's Privacy</h2>
			<p>The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.</p>

			<h2>10. International Users</h2>
			<p>The Service may be accessed from various countries. By using the Service, you consent to the processing of your information in accordance with this Privacy Policy.</p>

			<h2>11. Changes to This Policy</h2>
			<p>We may update this Privacy Policy from time to time. We will notify users of significant changes through appropriate channels. Continued use of the Service constitutes acceptance of any changes.</p>

			<h2>12. Contact Information</h2>
			<p>If you have questions about this Privacy Policy, please contact us through our <a href="https://github.com/RyanLua/Disclip/issues">GitHub repository</a>.</p>

			<h2>13. Third-Party Services</h2>
			<p>The Service integrates with:</p>
			<ul>
				<li><strong>Discord:</strong> Subject to <a href="https://discord.com/privacy">Discord's Privacy Policy</a></li>
				<li><strong>Cloudflare Workers:</strong> Subject to <a href="https://www.cloudflare.com/privacy/">Cloudflare's Privacy Policy</a></li>
			</ul>
		</div>
	</body>
</html>`;

	return new Response(html, {
		headers: {
			'content-type': 'text/html;charset=UTF-8',
			'Cache-Control': 'max-age=86400', // Cache for 24 hours
		},
	});
});

/**
 * Main route for all requests sent from Discord.  All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post('/interactions', async (request, env, ctx) => {
	const { isValid, interaction } = await server.verifyDiscordRequest(
		request,
		env,
	);
	if (!isValid || !interaction) {
		return new Response('Bad request signature.', { status: 401 });
	}

	if (interaction.type === InteractionType.Ping) {
		// The `PING` message is used during the initial webhook handshake, and is
		// required to configure the webhook in the developer portal.
		return new JsonResponse({
			type: InteractionResponseType.Pong,
		});
	}

	if (interaction.type === InteractionType.ApplicationCommand) {
		// Most user commands will come as `APPLICATION_COMMAND`.
		switch (interaction.data.name.toLowerCase()) {
			case PING_COMMAND.name.toLowerCase(): {
				return new JsonResponse({
					type: InteractionResponseType.ChannelMessageWithSource,
					data: {
						content: 'Pong! 🏓',
						flags: MessageFlags.Ephemeral,
					},
				});
			}
			case CLIP_COMMAND.name.toLowerCase(): {
				ctx.waitUntil(generateMessageClip(interaction, env));

				return new JsonResponse({
					type: InteractionResponseType.DeferredChannelMessageWithSource,
				});
			}
			default:
				return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
		}
	}

	console.error('Unknown Type');
	return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
});
router.all('*', () => new Response('Not Found.', { status: 404 }));

/**
 * Verify the incoming request from Discord.
 * @param {Request} request
 * @param {Env} env
 * @returns {Promise<{interaction?: import('discord-api-types/v10').APIInteraction, isValid: boolean}>}
 */
async function verifyDiscordRequest(request, env) {
	const signature = request.headers.get('x-signature-ed25519');
	const timestamp = request.headers.get('x-signature-timestamp');
	const body = await request.text();
	const isValidRequest =
		signature &&
		timestamp &&
		(await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
	if (!isValidRequest) {
		return { isValid: false };
	}

	return { interaction: JSON.parse(body), isValid: true };
}

const server = {
	verifyDiscordRequest,
	fetch: router.fetch,
};

export default server;
