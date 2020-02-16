var textRequest = new Houndify.TextRequest({
  // Text query
  query: "What is the weather like?",

  // Your Houndify Client ID
  clientId: "j4_kxRXSMt6bY172r1ydYg==",

  authURL: "/main",

  requestInfo: {
    UserID: "test_user",
    Latitude: 37.388309,
    Longitude: -121.973968
  },

  conversationState: conversationState,

  proxy: {
    method: 'POST',
    url: "/textSearchProxy",
  },

  // Response and error handlers
  onResponse: function(response, info) {
    console.log(response);
  },

  onError: function(err, info) {
    console.log(err);
  }
});

textRequest()
