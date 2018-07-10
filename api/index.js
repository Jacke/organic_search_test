const dotenv = require('dotenv').config();
const express = require('express');
const api = express();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');
const Shopify = require('shopify-api-node');
const cors = require('cors')

const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const SEC = 5; // Seconds for storing queries
var accessToken = process.env.ACCESS_TOKEN;

const scopes = 'read_products, read_orders';
const forwardingAddress = "https://56c2caab.ngrok.io"; // Replace this with your HTTPS Forwarding address
const shopify = new Shopify({
  shopName: 'test-shopshop',
  accessToken: accessToken
});

var PERSISTENCE_LAYER = []
var PERSISTENCE_UPDATED = undefined;

api.use(cors());
api.get('/', (req, res) => res.redirect('/api/v1/orders'));

api.get('/api/v1/orders', (req, res) => {
  if (PERSISTENCE_UPDATED == undefined || ((Math.floor(Date.now() / 1000)) - PERSISTENCE_UPDATED) > SEC) {
    return shopify.order.list({ limit: 100 })
    .then(orders => {
      console.log(orders)
      // Keep order persistence
      PERSISTENCE_LAYER = orders;
      PERSISTENCE_UPDATED = Math.floor(Date.now() / 1000);

      return res.status(200).end( JSON.stringify(orders , null, 2) );
    }
    )
    .catch(err => 
      console.log(err)//res.redirect('/shopify')
    );
  } else {
    console.log('persistence');
    return res.status(200).end( JSON.stringify(PERSISTENCE_LAYER , null, 2) );;
  }
});

api.get('/shopify', (req, res) => {
  const state = nonce();
  const redirectUri = forwardingAddress + '/shopify/callback';
  const installUrl = 'https://' + 'test-shopshop.myshopify.com' +
    '/admin/oauth/authorize?client_id=' + apiKey +
    '&scope=' + scopes +
    '&state=' + state +
    '&redirect_uri=' + redirectUri;
  res.cookie('state', state);
  return res.redirect(installUrl);
});



api.get('/shopify/callback', (req, res) => {
  const { shop, hmac, code, state } = req.query;
  const stateCookie = cookie.parse(req.headers.cookie).state;

  if (state !== stateCookie) {
    return res.status(403).send('Request origin cannot be verified');
  }

  if (shop && hmac && code) {
    // DONE: Validate request is from Shopify
    const map = Object.assign({}, req.query);
    delete map['signature'];
    delete map['hmac'];
    const message = querystring.stringify(map);
    const providedHmac = Buffer.from(hmac, 'utf-8');
    const generatedHash = Buffer.from(
      crypto
        .createHmac('sha256', apiSecret)
        .update(message)
        .digest('hex'),
        'utf-8'
      );
    let hashEquals = false;

    try {
      hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
    } catch (e) {
      hashEquals = false;
    };

    if (!hashEquals) {
      return res.status(400).send('HMAC validation failed');
    }

    // DONE: Exchange temporary code for a permanent access token
    const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
    const accessTokenPayload = {
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    };

    request.post(accessTokenRequestUrl, { json: accessTokenPayload })
    .then((accessTokenResponse) => {
      accessToken = accessTokenResponse;
      return res.redirect('/');
    })
    .catch((error) => {
      res.status(error.statusCode).send(error.error.error_description);
    });

  } else {
    res.status(400).send('Required parameters missing');
  }
});


api.listen(3000, () => {
  console.log('Example api listening on port 3000!');
});