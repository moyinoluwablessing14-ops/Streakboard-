const axios = require('axios');

const TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = process.env.GIST_ID;

const defaultData = {
  wallets: {},
  raffle: { entries: [], lastWinner: null, lastDrawDate: null },
  campaigns: []
};

async function readDB() {
  try {
    const res = await axios.get(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Authorization: `token ${TOKEN}` }
    });
    const content = res.data.files['streakboard-db.json'].content;
    return JSON.parse(content);
  } catch (e) {
    console.error('readDB error:', e.message);
    return { ...defaultData };
  }
}

async function writeDB(data) {
  try {
    await axios.patch(`https://api.github.com/gists/${GIST_ID}`, {
      files: {
        'streakboard-db.json': {
          content: JSON.stringify(data, null, 2)
        }
      }
    }, {
      headers: { Authorization: `token ${TOKEN}` }
    });
  } catch (e) {
    console.error('writeDB error:', e.message);
  }
}

module.exports = { readDB, writeDB };
