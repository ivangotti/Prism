const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { ensureStepUpMfa } = require('../middleware/stepUpMfa');
const { getUserFactors, enrollFactor, removeFactor } = require('../utils/okta');
const { getUserSetting } = require('../utils/userSettings');
const axios = require('axios');

/**
 * Get user's factors from Okta
 */
async function getFactors(accessToken, userId) {
  const url = `https://${process.env.OKTA_DOMAIN}/api/v1/users/${userId}/factors`;

  try {
    const response = await axios({
      method: 'GET',
      url,
      headers: {
        'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching factors:', error.message);
    return [];
  }
}

/**
 * GET settings page - list authenticators
 */
router.get('/', ensureAuthenticated, ensureStepUpMfa, async (req, res) => {
  try {
    const userInfo = req.userContext.userinfo;
    const accessToken = req.userContext.tokens.access_token;

    // Fetch enrolled factors
    const factors = await getFactors(accessToken, userInfo.sub);

    // Load security image from local settings
    const securityImage = await getUserSetting(userInfo.sub, 'securityImage');

    res.render('settings', {
      title: 'Authenticator Settings',
      user: userInfo,
      isAuthenticated: true,
      factors: factors,
      success: req.query.success,
      error: req.query.error,
      enrollmentData: req.session.enrollmentData || null,
      darkMode: req.session.darkMode || false,
      securityImage: securityImage
    });

    // Clear enrollment data after rendering
    delete req.session.enrollmentData;
  } catch (error) {
    console.error('Settings page error:', error);
    res.status(500).render('error', {
      message: 'Unable to load settings',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * POST start enrollment for TOTP
 */
router.post('/enroll/totp', ensureAuthenticated, async (req, res) => {
  try {
    const userInfo = req.userContext.userinfo;
    const url = `https://${process.env.OKTA_DOMAIN}/api/v1/users/${userInfo.sub}/factors`;

    const response = await axios({
      method: 'POST',
      url,
      headers: {
        'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        factorType: 'token:software:totp',
        provider: 'OKTA'
      }
    });

    // Store enrollment data in session for verification step
    req.session.enrollmentData = {
      factorId: response.data.id,
      qrCode: response.data._embedded.activation._links.qrcode.href,
      sharedSecret: response.data._embedded.activation.sharedSecret,
      factorType: 'totp'
    };

    res.redirect('/settings?enrolling=totp');
  } catch (error) {
    console.error('TOTP enrollment error:', error.response?.data || error.message);
    res.redirect('/settings?error=' + encodeURIComponent('Failed to start TOTP enrollment'));
  }
});

/**
 * POST verify TOTP enrollment
 */
router.post('/enroll/totp/verify', ensureAuthenticated, async (req, res) => {
  try {
    const userInfo = req.userContext.userinfo;
    const { factorId, passCode } = req.body;

    const url = `https://${process.env.OKTA_DOMAIN}/api/v1/users/${userInfo.sub}/factors/${factorId}/lifecycle/activate`;

    await axios({
      method: 'POST',
      url,
      headers: {
        'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        passCode: passCode
      }
    });

    delete req.session.enrollmentData;
    res.redirect('/settings?success=TOTP authenticator enrolled successfully');
  } catch (error) {
    console.error('TOTP verification error:', error.response?.data || error.message);

    // Keep enrollment data for retry
    const enrollmentData = req.session.enrollmentData;
    req.session.enrollmentData = enrollmentData;

    res.redirect('/settings?enrolling=totp&error=' + encodeURIComponent('Invalid verification code. Please try again.'));
  }
});

/**
 * POST start enrollment for SMS
 */
router.post('/enroll/sms', ensureAuthenticated, async (req, res) => {
  try {
    const userInfo = req.userContext.userinfo;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.redirect('/settings?error=' + encodeURIComponent('Phone number is required'));
    }

    const url = `https://${process.env.OKTA_DOMAIN}/api/v1/users/${userInfo.sub}/factors`;

    const response = await axios({
      method: 'POST',
      url,
      headers: {
        'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        factorType: 'sms',
        provider: 'OKTA',
        profile: {
          phoneNumber: phoneNumber
        }
      }
    });

    // Store enrollment data for verification
    req.session.enrollmentData = {
      factorId: response.data.id,
      phoneNumber: phoneNumber,
      factorType: 'sms'
    };

    res.redirect('/settings?enrolling=sms');
  } catch (error) {
    console.error('SMS enrollment error:', error.response?.data || error.message);
    res.redirect('/settings?error=' + encodeURIComponent('Failed to enroll SMS authenticator. Please check phone number format (+1234567890)'));
  }
});

/**
 * POST verify SMS enrollment
 */
router.post('/enroll/sms/verify', ensureAuthenticated, async (req, res) => {
  try {
    const userInfo = req.userContext.userinfo;
    const { factorId, passCode } = req.body;

    const url = `https://${process.env.OKTA_DOMAIN}/api/v1/users/${userInfo.sub}/factors/${factorId}/lifecycle/activate`;

    await axios({
      method: 'POST',
      url,
      headers: {
        'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        passCode: passCode
      }
    });

    delete req.session.enrollmentData;
    res.redirect('/settings?success=SMS authenticator enrolled successfully');
  } catch (error) {
    console.error('SMS verification error:', error.response?.data || error.message);

    // Keep enrollment data for retry
    const enrollmentData = req.session.enrollmentData;
    req.session.enrollmentData = enrollmentData;

    res.redirect('/settings?enrolling=sms&error=' + encodeURIComponent('Invalid verification code. Please try again.'));
  }
});

/**
 * POST cancel enrollment
 */
router.post('/enroll/cancel', ensureAuthenticated, async (req, res) => {
  try {
    const enrollmentData = req.session.enrollmentData;

    if (enrollmentData && enrollmentData.factorId) {
      const userInfo = req.userContext.userinfo;

      // Delete the pending factor
      try {
        await removeFactor(null, userInfo.sub, enrollmentData.factorId);
      } catch (err) {
        // Factor might not exist or already deleted, that's okay
        console.log('Factor deletion during cancel:', err.message);
      }
    }

    delete req.session.enrollmentData;
    res.redirect('/settings');
  } catch (error) {
    console.error('Cancel enrollment error:', error);
    delete req.session.enrollmentData;
    res.redirect('/settings');
  }
});

/**
 * POST remove authenticator
 */
router.post('/factor/:factorId/delete', ensureAuthenticated, async (req, res) => {
  try {
    const userInfo = req.userContext.userinfo;
    const factorId = req.params.factorId;

    await removeFactor(null, userInfo.sub, factorId);

    res.redirect('/settings?success=Authenticator removed successfully');
  } catch (error) {
    console.error('Factor removal error:', error);
    res.redirect('/settings?error=' + encodeURIComponent('Failed to remove authenticator'));
  }
});

module.exports = router;
