const fs = require('fs');
const OAuthClient = require('intuit-oauth');

const load_data = fs.readFileSync('src/middlewares/auth-tokens.json',
  { encoding: 'utf8', flag: 'r' });
const load_token_data = JSON.parse(load_data)

const oauthClient = new OAuthClient({
  clientId: process.env.INTUIT_CLIENT_ID,
  clientSecret: process.env.INTUIT_CLIENT_SECRET,
  // environment: 'sandbox' || 'production',
  environment: 'sandbox',

  //sandbox needs to be changed before going to the production.
  redirectUri: 'https://damcogroup10.monday.com/boards/2404548030',
  token: load_token_data
});

async function addIntuitAuthentication(req, res, next) {
  try {
    const data = fs.readFileSync('src/middlewares/auth-tokens.json',
      { encoding: 'utf8', flag: 'r' });
    const token_data = JSON.parse(data)
    console.log(oauthClient.isAccessTokenValid());
    let authResponses;

    if (oauthClient.isAccessTokenValid()) {
      console.log('The access_token is valid');
      authResponses = oauthClient.getToken().getToken();
      req.intuitAuth = { authResponses };
      next();
    }

    if (!oauthClient.isAccessTokenValid()) {
      oauthClient
        .refresh()
        .then(function (authResponse) {
          authResponses = authResponse.getJson();
          oauthClient.setToken(authResponses);
          let token = oauthClient.getToken().getToken();
          let fileData = JSON.stringify(token);
          fs.writeFileSync('src/middlewares/auth-tokens.json', fileData);
          req.intuitAuth = { authResponses };
          next();
        })
        .catch(function (e) {
          console.error('The error message is :' + e);
          console.error(e.intuit_tid);
          res.status(500).json({ error: 'Please Add Intuit Authentication.' });
        });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Please Add Intuit Authentication.' });
  }
}

module.exports = {
  addIntuitAuthentication
};
