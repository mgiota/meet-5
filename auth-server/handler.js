const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const calendar = google.calendar("v3");

/** SCOPES documentation: https://developers.google.com/identity/protocols/oauth2/scopes */
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

const credentials = {
    client_id: process.env.CLIENT_ID,
    project_id: process.env.PROJECT_ID,
    client_secret: process.env.CLIENT_SECRET,
    calendar_id: process.env.CALENDAR_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    redirect_uris: ["https://mgiota.github.io/meet-5/"],
    javascript_origins: ["https://mgiota.github.io", "http://localhost:3000"],
};
const { client_secret, client_id, redirect_uris, calendar_id } = credentials;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

/** The first step in the OAuth process is to generate a URL so users can log in with Google and be authorized to see your calendar. After logging in, they’ll receive a code as a URL parameter. */

module.exports.getAuthURL = async () => {
    
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods:": "*",
        "Access-Control-Allow-Credentials" : true
      },
      body: JSON.stringify({
        authUrl: authUrl,
      }),
    };
  };

//  Get access token

module.exports.getAccessToken = async (event) => {
    // The values used to instantiate the OAuthClient are at the top of the file
      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
  );
      // Decode authorization code extracted from the URL query
      const code = decodeURIComponent(`${event.pathParameters.code}`);
  

  return new Promise((resolve, reject) => {
    /**
     *  Exchange authorization code for access token with a “callback” after the exchange,
     *  The callback in this case is an arrow function with the results as parameters: “err” and “token.”
     */

    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        return reject(err);
      }
      return resolve(token);
    });
  })
    .then((token) => {
      // Respond with OAuth token 
      return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods:": "*",
            "Access-Control-Allow-Credentials" : true
        },
        body: JSON.stringify(token),
      };
    })
    .catch((err) => {
      // Handle error
      console.error(err);
      return {
        statusCode: 500,
        body: JSON.stringify(err),
      };
    });
};


/* Get Calendar Events */

module.exports.getCalendarEvents = async (event) => {
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  const access_token = decodeURIComponent(`${event.pathParameters.access_token}`);
  oAuth2Client.setCredentials({ access_token });

  return new Promise((resolve, reject) => {
    calendar.events.list(
      {
        calendarId: calendar_id,
        auth: oAuth2Client,
        timeMin: new Date().toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      },
      (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      }
    );
  })
  .then((results) => {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods:": "*",
        "Access-Control-Allow-Credentials" : true
      },
      body: JSON.stringify({ events: results.data.items }),
    };
  })
  .catch((err) => {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  });
};