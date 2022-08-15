import express from 'express';
import { isEven } from '@vdtn359/is-even';

const app = express();
const port = 3000;

app.get('/is-even/:number', (req, res) => {
	const result = isEven(Number(req.params.number));
	return res.status(200).send(result);
});

app.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`Server listening at http://localhost:${port}`);
});
