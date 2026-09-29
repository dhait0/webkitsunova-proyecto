import app from '../dist/src/app.js';

export default async function handler(req, res) {
    return new Promise((resolve, reject) => {
        app(req, res, (err) => {
            if (err)
                return reject(err);
            resolve();
        });
    });
}
