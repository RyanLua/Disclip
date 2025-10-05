/**
 * @param {import('discord-api-types/v10').APIMessageComponentInteraction} interaction
 * @param {*} env - The environment variables.
 */
export async function saveClip(interaction, env) {
	const userId = interaction.member?.user?.id;

	try {
		const headers = {
			'Content-Type': 'application/json',
			Authorization: `Bot ${env.DISCORD_TOKEN}`,
		};

		const dmRes = await fetch(
			'https://discord.com/api/v10/users/@me/channels',
			{
				method: 'POST',
				headers,
				body: JSON.stringify({ recipient_id: userId }),
			},
		);
		if (!dmRes.ok) {
			console.error('saveClip: create DM failed', dmRes.status);
			return;
		}

		const { id: channelId } = await dmRes.json();
		if (!channelId) return;

		const msgRes = await fetch(
			`https://discord.com/api/v10/channels/${channelId}/messages`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify({ content: 'hi' }),
			},
		);
		if (!msgRes.ok) console.error('saveClip: send DM failed', msgRes.status);
	} catch (err) {
		console.error('saveClip: error', err);
	}
}
