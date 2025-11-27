import app from '../server/index.js';

export default function (req, res) {
    console.log('Vercel API Request:', req.url);
    return app(req, res);
}
