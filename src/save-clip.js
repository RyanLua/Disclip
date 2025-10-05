/**
 * Send a DM saying "hi" to the user who clicked the button.
 * This uses the Discord REST API to create (or fetch) a DM channel and send a message.
 *
 * @param {import('discord-api-types/v10').APIMessageComponentInteraction} interaction
 * @param {{ DISCORD_APPLICATION_ID: string; DISCORD_TOKEN?: string }} env
 */
export async function saveClip(interaction, env) {
	try {
		// Prefer member.user if present (guild context), otherwise interaction.user
		/** @type {{ id: string }} */
		const user = interaction.member?.user ?? interaction.user;
		if (!user?.id) {
			console.error('saveClip: No user on interaction');
			return;
		}

		if (!env.DISCORD_TOKEN) {
			console.error('saveClip: DISCORD_TOKEN is not set in environment');
			return;
		}

		// 1) Create or fetch a DM channel with the user
		const dmResp = await fetch(
			'https://discord.com/api/v10/users/@me/channels',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bot ${env.DISCORD_TOKEN}`,
				},
				body: JSON.stringify({ recipient_id: user.id }),
			},
		);

		if (!dmResp.ok) {
			const text = await dmResp.text().catch(() => '');
			console.error(
				'saveClip: Failed to create DM channel',
				dmResp.status,
				text,
			);
			return;
		}

		const dmChannel = await dmResp.json();
		const channelId = dmChannel.id;
		if (!channelId) {
			console.error('saveClip: No channel id returned when creating DM');
			return;
		}

		// 2) Send the DM message
		const msgResp = await fetch(
			`https://discord.com/api/v10/channels/${channelId}/messages`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bot ${env.DISCORD_TOKEN}`,
				},
				body: JSON.stringify({ content: 'hi' }),
			},
		);

		if (!msgResp.ok) {
			const text = await msgResp.text().catch(() => '');
			console.error('saveClip: Failed to send DM', msgResp.status, text);
		}
	} catch (err) {
		console.error('saveClip: Unexpected error', err);
	}
}
