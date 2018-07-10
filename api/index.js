const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');
const Shopify = require('shopify-api-node');

const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
var accessToken = process.env.ACCESS_TOKEN;

const scopes = 'read_products, read_orders';
const forwardingAddress = "https://56c2caab.ngrok.io"; // Replace this with your HTTPS Forwarding address

app.get('/api/v1/orders', (req, res) => {
  const shopRequestUrl = 'https://test-shopshop.myshopify.com/admin/orders.json';
  console.log('Access token:', accessToken);
  const shopRequestHeaders = {
    'X-Shopify-Access-Token':  accessToken,
  };

  request.get(shopRequestUrl, { headers: shopRequestHeaders })
  .then((shopResponse) => {
    console.log(shopResponse);
    return res.status(200).end(shopResponse);
  })
  .catch((error) => {
    console.log(error);    
    return res.redirect('/shopify')
  });
});

app.get('/shopify', (req, res) => {
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



app.get('/shopify/callback', (req, res) => {
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


app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});