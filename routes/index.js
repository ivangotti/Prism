const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { getUserApps } = require('../utils/okta');
const { getUserSetting } = require('../utils/userSettings');

/**
 * Home page - displays user's applications
 */
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const userInfo = req.userContext.userinfo;
    const accessToken = req.userContext.tokens.access_token;

    // Fetch user's applications from Okta
    let apps = [];
    try {
      apps = await getUserApps(accessToken, userInfo.sub);
    } catch (error) {
      console.error('Error fetching apps:', error.message);
      // Continue rendering with empty apps array
    }

    // Load security image from local settings
    const securityImage = await getUserSetting(userInfo.sub, 'securityImage');

    res.render('home', {
      title: 'My Applications',
      user: userInfo,
      isAuthenticated: true,
      apps: apps,
      darkMode: req.session.darkMode || false,
      securityImage: securityImage
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).render('error', {
      message: 'Unable to load applications',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

module.exports = router;
