const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { getUserSetting } = require('../utils/userSettings');

/**
 * Decode JWT token (without verification - for display only)
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    return {
      header,
      payload,
      signature: parts[2]
    };
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * GET tokens page
 */
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const tokens = req.userContext?.tokens || {};
    const userInfo = req.userContext.userinfo;

    // Decode tokens
    const decodedAccessToken = tokens.access_token ? decodeJWT(tokens.access_token) : null;
    const decodedIdToken = tokens.id_token ? decodeJWT(tokens.id_token) : null;
    const decodedRefreshToken = tokens.refresh_token ? decodeJWT(tokens.refresh_token) : null;

    // Calculate expiration times
    const now = Math.floor(Date.now() / 1000);
    const accessTokenExp = decodedAccessToken?.payload?.exp;
    const idTokenExp = decodedIdToken?.payload?.exp;

    // Load security image from local settings
    const securityImage = await getUserSetting(userInfo.sub, 'securityImage');

    res.render('tokens', {
      title: 'JWT Tokens',
      user: req.userContext.userinfo,
      isAuthenticated: true,
      tokens: {
        access_token: tokens.access_token,
        id_token: tokens.id_token,
        refresh_token: tokens.refresh_token
      },
      decoded: {
        access_token: decodedAccessToken,
        id_token: decodedIdToken,
        refresh_token: decodedRefreshToken
      },
      expiration: {
        access_token: accessTokenExp ? {
          timestamp: accessTokenExp,
          date: new Date(accessTokenExp * 1000).toLocaleString(),
          expired: accessTokenExp < now,
          remaining: accessTokenExp - now
        } : null,
        id_token: idTokenExp ? {
          timestamp: idTokenExp,
          date: new Date(idTokenExp * 1000).toLocaleString(),
          expired: idTokenExp < now,
          remaining: idTokenExp - now
        } : null
      },
      darkMode: req.session.darkMode || false,
      securityImage: securityImage
    });
  } catch (error) {
    console.error('Tokens page error:', error);
    res.status(500).render('error', {
      message: 'Unable to load tokens',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

module.exports = router;
