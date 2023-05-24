import * as dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { existsSync } from 'fs';

import { verifyJwt } from './utils/verifyJwt.js';
import config from './config.js';

export const loadEnv = (options) => {
	if (existsSync('.env.local')) {
		dotenv.config({ path: `.env.local`, ...options });
	}

	dotenv.config(options);
};

loadEnv();

const { server } = config || {};

const {
	SERVER_AUTH_PERMISSIONS: AUTH_PERMISSIONS = server?.permissions || [],
	PORT: port,
} = process.env;

const permissions = Array.isArray(AUTH_PERMISSIONS) ? AUTH_PERMISSIONS : AUTH_PERMISSIONS.split(' ');

const app = express();

app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(helmet());

app.get('/api/public', (req, res) => {
	res.json({
		success: true,
		message: 'This is the Public API. Anyone can request this response. Hooray!',
	})
}
);

app.get('/api/private', verifyJwt({ audience: ['not_configured'] }), (req, res) =>
	res.json({
		success: true,
		message:
			'This is the private API. Only special folk, indicated by the `audience` configuration, can access it. Awesome!',
	})
);

app.get('/api/scoped', verifyJwt({ claimsToAssert: { 'permissions.includes': permissions } }), (req, res) =>
	res.json({
		success: true,
		message:
			'This is the scoped API. Only a valid access token with both the correct audience AND valid permissions has access. You did it!',
	})
);

app.get('*', (req, res) => res.json({ success: true, message: 'This is the home route for this API server!' }))

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
