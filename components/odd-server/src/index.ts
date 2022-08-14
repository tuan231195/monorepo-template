import { isOdd } from '@vdtn359/is-odd';
import express from 'express';

const app = express();
const port = 3000;

app.get('/is-odd/:number', (req, res) => {
	const result = isOdd(Number(req.params.number));
	return res.status(200).send(result);
});

app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening at http://localhost:${port}`);
});
