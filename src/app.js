import { InteractionResponseType, InteractionType } from 'discord-interactions';
import 'dotenv/config';
import express from 'express';
import { VerifyDiscordRequest } from './utils.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function(req, res) {
	// Interaction type and data
	const { type, data } = req.body;

	/**
	 * Handle verification requests
	 */
	if (type === InteractionType.PING) {
		return res.send({ type: InteractionResponseType.PONG });
	}

	// Log request bodies
	console.log(req.body);

	/**
	 * Handle slash command requests
	 * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
	 */
	if (type === InteractionType.APPLICATION_COMMAND) {
		const { name } = data;

		// "ping" command
		if (name === 'ping') {
			// Send a message into the channel where command was triggered from
			return res.send({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content:
						'Pong!',
				},
			});
		}
	}

	/**
	 * Handle message command requests
	 * See https://discord.com/developers/docs/interactions/application-commands#message-commands
	 */
	if (type === InteractionType.MESSAGE_COMPONENT) {
		const { name } = data;

		// "clip" command
		if (name === 'clip') {
			// Create a clip from the current video
			return res.send({
				type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
				data: {
					content: 'Clip created successfully!',
				},
			});
		}
	}
});

app.listen(PORT, () => {
	console.log('Listening on port', PORT);
});