<img src="https://static.houndify.com/images/houndify-logo@2x.png">

# Houndify JavaScript SDK
The Houndify JavaScript SDK allows you to make voice and text queries to the Houndify API from a web browser or NodeJS. It comes in two forms: 

- the in-browser javascript library [**houndify.js**](https://www.houndify.com/sdks#web) 
- the server-side Node.js module [**houndify**](https://www.npmjs.com/package/houndify). 

Both parts contain functions for sending text and voice requests to the Houndify API. Additionally the in-browser library has an `AudioRecorder` for capturing audio from microphone, and the Node.js module has authentication and proxy middleware creators for Express servers.

We'll go through the following:
  1. [Installation](#Installation)
  2. [Demos](#Demos)
  3. [Browser SDK Setup](#Setting-up-the-SDK-for-a-browser)
  4. [NodeJS SDK Setup](#Setting-up-the-SDK-for-NodeJS)
  5. [Using the SDK](#Using-the-SDK)
  6. [Recording Audio in the Browser](#Recording-Audio-in-the-Browser)
  7. [Managing Conversation State](#Managing-Conversation-State)
  8. [Supporting React Native](#Supporting-Houndify-React-Native)

## Installation
The easiest way to install the SDK is via npm:

```
npm install houndify
```

You can also download the SDK from the [Client SDKs](https://houndify.com/sdks) section of the Houndify website.

## Demos
Below, we'll explain how to use this package. However, for folks who prefer reading code, we've prepared an [official example repository](https://github.com/soundhound/hound-sdk-web-example) with a simple site using the SDK. 

You'll find installation instructions for the example in the example repo's README.


## Setting up the SDK for a browser
If you wish to use the JS SDK to send Voice or Text Requests from the browser, follow one of these two methods.


##### Limitations

> **Your browser needs to have access to the microphone**: To accept voice requests, your browser must have the [getUserMedia API](https://caniuse.com/#feat=stream) available. 


> **SSL is required for deployment**: The latest versions of web browsers require secure connection for giving access to microphone. While you can test JavaScript SDK on `localhost` with a HTTP server, you'll need to set up a HTTPS server when you actually deploy it. 
 To do this, set "https" flag in config file to **true**, and point `sslCrtFile` to ssl certificate and `sslKeyFile` to ssl key file. This is only required if you are terminating SSL on the application layer. If deploying with services like Heroku, this will be taken care for you and you don't have to mess with SSL Certificates.

### Method 1: directly hosting the SDK yourself.
You'll need to download the SDK from <a href="https://www.houndify.com/sdks#javascript">here</a>. Put it somewhere in the `/public` directory of the server hosting your site.

```html
<script src="/path/to/houndify.js"></script>
```
This exposes a global `Houndify` object. Somewhere else in your site, you can have something like this: (we'll cover the details of the actual request later)
```html
<script>
const voiceRequest = new Houndify.VoiceRequest({ /* options */ });
</script>
```
### Method 2: using a bundler.

If you are using something like browserify, you can also *require* `Houndify` as a CommonJS module.

```javascript
const Houndify = require('houndify');
```

#### <div class="important">Important!! SETTING UP YOUR SERVER</div>
Whichever of these methods you use, you still need to add some server-side logic.

Our servers need your **CLIENT_ID and CLIENT_KEY** to process your request. However, the key is private and shouldn't be put directly in your website, which is accessible to anyone.

So, you must create a server which will add this information to your site's requests. 

We've already done the heavy lifting here--you just need to install the Houndify SDK on your server to add a couple routes. 

***We recommend using a NodeJS server with Express.***


### Setting up your server for browser requests
Assuming your server is using express, this [**houndify**](https://www.npmjs.com/package/houndify) module contains a `HoundifyExpress` object that provides methods to authenticate and proxy voice and text search requests. For the rest of this tutorial, we'll assume you are familiar with Express (or at least Node).


The `houndify.HoundifyExpress` object should only be used on the server. It won't work in the browser. It lets you easily create routes to help with:

- Authenticating Requests
- Proxying Text Search Requests
- Handling React Native requests.



#### 1) Import Houndify express
First, run this in the root directory of your server application.
```
npm install --save houndify
```
Then, import Houndify by adding this to your server.
```javascript
const houndifyExpress = require('houndify').HoundifyExpress;
```

Finally, add the following route handlers.
```javascript
//authenticates requests
app.get('/houndifyAuth', houndifyExpress.createAuthenticationHandler({ 
  clientId:  "YOUR_CLIENT_ID",
  clientKey: "YOUR_CLIENT_KEY"
}));

//proxies text requests
app.post('/textSearchProxy', houndifyExpress.createTextProxyHandler());
```

>If your web server is not written in JavaScript, refer to the *Not Using NodeJS* section on how to reimplement these route handlers in other languages.

Now you are set up to use Houndify in your browser app. You can also make requests directly from your server rather than using a browser app. 

Since both of these methods (browser and server) use the same SDK from here out, we'll explain how to set up a server-only environment before diving into the SDK itself.

If you don't want to run a server-only version of houndify, feel free to jump directly to the SDK [here](#Using-the-SDK).


### Setting up the SDK for NodeJS
You can also use the Houndify JS SDK in a NodeJS environment with no browser at all. To set it up, just run

```
npm i --save houndify
```

and import Houndify using:
```
const Houndify = require('houndify')
```

If you did this in a file called `index.js`, you could of course run it with `node index.js`. We have a few example of this in the example repo we mentioned above.

# Using the SDK
Houndify enables your app to make text and voice requests. We'll go through how to do just that.

#### API Overview


The `Houndify` object has the following constructors and utility methods. 

* `VoiceRequest(options)` - constructor for initializing voice requests

* `TextRequest(options)` - constructor for initializing text requests

* `AudioRecorder(options)` - constructor for initializing audio recorder for browsers (Chrome, Firefox)

* `decodeAudioData` - utility for decoding audio data uploaded with `FileReader`

* `HoundifyExpress.createAuthenticationHandler` - Express Route handler for authenticating all Houndify requests through an Express server

* `HoundifyExpress.createTextProxyHandler` - Express Route handler for proxying text requests through an Express server
  
* `HoundifyExpress.createReactNativeProxy` - Express Route handler for supporting React Native applications.

## Text Requests
We'll start with text requests, since they're a bit simpler. This lets your user type in commands and queries to get a response. This response can be shown directly to the user, or processed by your application.

In the setup section, you would have exposed a `Houndify` object.
To make a text request, you simply call 
```javascript
Houndify.TextRequest({...});
```
and receive results through callbacks. In place of "..." you must pass in some options. These are,


#### clientId <span class="notice">(required)</span>
Your client Id from the Houndify application dashboard. 
```javascript
{
  //...

  clientId: 'CLIENT_ID'

  //...
}
```

#### clientKey <span class="notice">(required if not in browser)</span>
Your client Key from the Houndify application dashboard. This should never be shared publicly. However, *while developing internally*, feel to add this in a browser app if you are sure it will not be seen outside your team.
```javascript
{
  //...

  clientKey: 'CLIENT_KEY'

  //...
}
```

#### query <span class="notice">(required)</span>
The text you'd like to send to houndify.
```javascript
{
  //...

  query: "What's the weather like in Santa Clara?"

  //...
}
```

#### authUrl <span class="notice">(required if in browser)</span>
The route on your server where your app can sign it's request. **If you are developing internally** and have added a clientKey, feel free to omit this.
```javascript
{
  //...

  authUrl: '/houndifyAuth'

  //...
}
```

#### requestInfo <span class="notice">(required)</span>
A valid [RequestInfo Object](https://docs.houndify.com/reference/RequestInfo). This gives Houndify more contextual information to handle your request. Must include, at the very minimum, a `UserId` property. When developing, feel free to make this `test_user`.
```js
{
  //...
  requestInfo: {...}
  //...
}
```

#### conversationState
A valid [ConversationState Object](https://docs.houndify.com/reference/ConversationState). These will be returned from Houndify with each request. Storing and returning this object with each request you make will let Houndify continue conversations.
```js
{
  //...
  conversationState: [...]
  //...
}
```

#### proxy <span class="notice">(required if in browser)</span>
The server endpoint used for forwarding text requests to the Houndify backend. Described [in setup above](#Setting-up-your-server-for-browser-requests), it is implemented on your server using `HoundifyExpress.createTextProxyHandler()`.
```js
{
  //...
    proxy: {
    method: 'POST',
    url: "/textSearchProxy",
    headers: {}
  },
  //...
}
```

#### onError and onResponse <span class="notice">(required)</span>
Callbacks to handle a successful response or error from houndify. **onResponse** is called with a HoundifyResponse object if the request is successful, otherwise **onError** is called with the error.
```js
{
  //...
    onResponse: (response, info) => {},
    onError: (error, info) => {}
  },
  //...
}
```

### Text Request Example
All together, a simple text request from the browser might look like this.
```javascript
var textRequest = new Houndify.TextRequest({
  // Text query
  query: "What is the weather like?",

  // Your Houndify Client ID
  clientId: "YOUR_CLIENT_ID",

  authURL: "/houndifyAuth",

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
```

### Best Practices when creating TextRequest objects
We recommend creating new `TextRequest` objects everytime a new voice request is triggered by the user. There's no need to reuse a single TextRequest object.

However, you probably want to keep track of things like the `requestInfo` and `conversationState` objects separately and pass them into each new `TextRequest` object that you create.

## Voice Requests
Voice requests allow you to stream audio to houndify. While streaming, you will receive transcriptions of what has been said. After the request, you will receive a `HoundifyResponse` object just like a text query would.

<span class="warn">**Note!**</span> Every property for `TextRequest` except `proxy` and `query` are the same as above. Those two properties are not needed for voice requests.  We'll explain only the new properties then provide an example.

##### Voice Request Overview
1. Create a voice request with the properties described below.
2. Stream in voice data with the methods described below.
3. Get results through callbacks.

#### onTranscriptionUpdate <span class="notice">(required)</span>
Callback to handle an updated transcription from houndify. While your user is speaking, this callback will call regularly with updated text. You can display this back to the user.
```js
{
  //...
    onTranscriptionUpdate: (transcript) => {},
  },
  //...
}
```

#### sampleRate <span class="notice">(required)</span>
The sample rate of your audio recording in Hz.
```js
{
  //...
    sampleRate: 16000,
  },
  //...
}
```

#### convertAudioToSpeex
**default: true**. If true, you must pass in 16-bit little-endian PCM audio. If false, you must pass in raw WAV, Opus, or Speex data. It will then be sent to Houndify without conversion.
```js
{
  //...
    convertAudioToSpeex: true,
  },
  //...
}
```

#### enableVAD
**default: true**. If true, Houndify will automatically turn off the mic when the user is finished speaking.
```js
{
  //...
    enableVAD: true,
  },
  //...
}
```

### VoiceRequest Methods
A `VoiceRequest` object has `write()`, `end()` and `abort()` methods for streaming audio and ending the request.

#### write(chunk)
By default, VoiceRequest.write() accepts 8/16 kHz mono 16-bit little-endian PCM samples in Int16Array chunks,
which are converted to Speex format. If you want to send raw bytes of WAV, Opus or Speex audio file make sure you set the `convertAudioToSpeex` option to false.
```javascript
const voiceRequest = Houndify.VoiceRequest({...});
//...
voiceRequest.write(audioChunk);
```
#### end()
Ends streaming voice search requests, expects the final response from backend
```javascript
const voiceRequest = Houndify.VoiceRequest({...});
//...
voiceRequest.end();
```

#### abort()
Aborts voice search request, does not expect final response from backend
```javascript
const voiceRequest = Houndify.VoiceRequest({...});
//...
voiceRequest.abort();
```

### Voice Request Example

```javascript
var voiceRequest = new Houndify.VoiceRequest({
  // Your Houndify Client ID
  clientId: "YOUR_CLIENT_ID",

  // For testing environment you might want to authenticate on frontend without Node.js server. 
  // In that case you may pass in your Houndify Client Key instead of "authURL".
  // clientKey: "YOUR_CLIENT_KEY",

  authURL: "/houndifyAuth",

  requestInfo: {
    UserID: "test_user",
    Latitude: 37.388309, 
    Longitude: -121.973968
  },

  // Pass the current ConversationState stored from previous queries
  // See https://www.houndify.com/docs#conversation-state
  conversationState: conversationState,

  // Sample rate of input audio
  sampleRate: 16000,
  
  // convertAudioToSpeex: true,

  // Enable Voice Activity Detection, default: true
  enableVAD: true,
  
  // Partial transcript, response and error handlers
  onTranscriptionUpdate: (transcript) => {
    console.log("Partial Transcript:", transcript.PartialTranscript);
  },

  onResponse: (response, info) =>{
    console.log(response);
  },

  onError: (err, info) => {
    console.log(err);
  }
});
```

## Recording Audio in the Browser
Recording audio data to stream it to a server usually takes a bit of boilerplate. To make it easier, we've created the `Houndify.AudioRecorder` object to take care of all that.

You can use a `Houndify.AudioRecorder()` object to **record audio in Chrome and Firefox** and feed it into `VoiceRequest` object. It has *start()*, *stop()*, and *isRecording()* methods and accepts handlers for "start", "data", "end" and "error" events.

```javascript
const recorder = new Houndify.AudioRecorder();
let voiceRequest;

recorder.on('start', () => { 
  voiceRequest = new Houndify.VoiceRequest({ ... });
});

recorder.on('data', (data) =>{
  voiceRequest.write(data);
});

recorder.on('end', () => { /* recording stopped, voiceRequest.onResponse() will be called. */ });

recorder.on('error', (err) => { /* recorder error, voiceRequest.onError() will be called. */ });

// Start capturing the audio
recorder.start();

// Stop capturing the audio
recorder.stop();

// Check if recorder is currently capturing the audio
recorder.isRecording();
```

For a better example on how the `AudioRecorder` integrates with the `VoiceRequest` object, view the example in the example respository.

### Best Practices when creating VoiceRequest objects
Similar to TextRequests, you should create a new `VoiceRequest` object for each text request that the user sends. However, you should keep track of the requestInfo and conversationState objects separately.

### Notes about VoiceRequest objects
<span class="warn">**Note!**</span> For voice search to work in production the frontend should be served through a secure connection. See example repository for HTTPS Express server setup. You do not need HTTPS for *localhost*.

**When testing**, (or at say a hackathon),  you can use Voice Search in the browser without setting up a Node.js server. You can pass in the authentication information **(Houndify Client ID and Client Key)** directly to `HoundifyClient` object and use the server of your choice **without the server-side houndify module.**

 <span class="important">**Important!**</span> Your Client Key is private and should not be exposed in the browser in production. Use `VoiceRequest` without server-side authentication only for testing, internal applications or Node.js scripts.


## Managing Conversation State
Conversation State is a feature that allows the Houndify backend to know about prior requests made by the user and use that to understand context. For example:

1. "What's the weather in Toronto?"
2. "What about Seattle?" 

This is supported in the SDK via the `conversationState` property that should be set for `Houndify.VoiceRequest` and `Houndify.TextRequest`.

If you want to support Conversation State in your app (you usually will want to), do the following:

1. Define a variable in your application that will manage conversation state for the user. 

```javascript
let userConversationState = {};
```

2. Initially pass in an empty object into the `conversationState` property.

```javascript
let voiceRequest = new Houndify.VoiceRequest({
  ...
  conversationState: userConversationState
})
```

3. In `onReponse()` the Houndify backend will return a new conversation state object, which you should set as the new value of `userConversationState`.

```javascript
let voiceRequest = new Houndify.VoiceRequest({
  ...
  conversationState: userConversationState,
  onResponse: (response, info) => {
    userConversationState = response.AllResults[0].ConversationState;
  }
})
```

4. Now, the conversation state has the prior request in it, and the backend will be able to interpret it on the next `VoiceRequest`.

5. If you ever want to get rid of the conversation state, you can reset it to an empty object.


## Supporting Houndify React Native 
We've developed a custom package for React Native apps to take work with the advantages and limitations of that platform. 

You can use our <a href="https://www.npmjs.com/package/houndify-react-native">houndify-react-native</a> library in your React Native app to add Houndify features. <span class="notice">**However**</span> to make it work, you must also add a server-side route using this library (minimum version 3.0.0). 

Similarly to how browser based requests must bounce through a server, the same goes for React Native applications. *Your app will send requests to your server, which will then forward them to houndify.*

This isn't hard to do, and is explained in detail <a href="https://www.npmjs.com/package/houndify-react-native">here.</a>

To summarize though, you must make sure your server contains the following:
```javascript
const houndifyExpress = require('houndify').HoundifyExpress;

const express = require('express');
const app = express();
require('express-ws')(app);

app.use(
  '/houndifyReactNativeProxy',
  houndifyExpress.createReactNativeProxy(express, 'CLIENT_ID', 'CLIENT_KEY')
)
```

This is very similar to the server-side setup from above, except for the addition of the `express-ws` package and another route.

Remember to make sure ```express-ws``` is in your package.json. This allows your server to recieve websocket requests (fast two way communication). The houndify-react-native library is configured to send requests to the route we've initialized here. 

Since you need to add express-ws in your app, rather than our library, you'll need to explicitly install it with 
```bash
npm i --save express-ws
```


## Not Using NodeJS?
A NodeJS backend is required if you want to use the JavaScript SDK. If your web server is not written in JavaScript, you can still use the SDK but you will need to re-implement the route handlers for authenticating requests and proxying text requests.

Below, we've added some code to help you do this.

### Reimplementing Authentication Route Handler
**createAuthenticationHandler({ clientId, clientKey })** accepts an object with Houndify Client Id and secret Houndify Client Key and returns an Express handler for authentication requests from client-side `HoundifyClient`. These requests will send a token as a query parameter and expect the signature back as a plain text.

```javascript
var crypto = require('crypto');

/**
 * Given Houndify Client Id and Client Key in options objects
 * returns an Express request handler for authenticating Voice Requests.
 * Signs a token/message with Houndify Client Key using the HMAC scheme.
 * The request for authentications will contain "token" query parameter
 * that needs to be signed with secret Client Key.
 *
 * @param {Object} opts - Options
 * @return {Function} An Express request handler
 */
function createAuthenticationHandler(opts) { 
    return function (req, res) {
        var clientKey = opts.clientKey.replace(/-/g, "+").replace(/_/g, "/");
        var clientKeyBin = new Buffer(clientKey, "base64");
        var hash = crypto.createHmac("sha256", clientKeyBin).update(req.query.token).digest("base64");
        var signature = hash.replace(/\+/g, "-").replace(/\//g, "_");
        res.send(signature);
    }
}
```

### Reimplementing Text Proxy Route Handler
**createTextProxyHandler()** returns a simple Express handler for proxying Text Requests from client-side `HoundifyClient` to Houndify backend. Query parameters of the incoming request should be reused for the request to backend (GET https://api.houndify.com/v1/text). Pick all "hound-*" headers from the incoming request, and send them to the backend with the same names.

```javascript
var request = require('request');

/**
 * Returns a simple Express handler for proxying Text Requests.
 * The handler takes query parameters and Houndify headers, 
 * and sends them in the request to backend (GET https://api.houndify.com/v1/text). 
 *
 * @return {Function} An Express request handler
 */
function createTextProxyHandler() {
    return function (req, res) {
        var houndifyHeaders = {};
        for (var key in req.headers) {
            var splitKey = key.toLowerCase().split("-");
            if (splitKey[0] == "hound") {
                var houndHeader = splitKey.map(function(pt) {
                    return pt.charAt(0).toUpperCase() + pt.slice(1);
                }).join("-");
                houndifyHeaders[houndHeader] = req.headers[key];
            }
        }
 
        //GET requests contain Request Info JSON in header.
        //POST requests contain Request Info JSON in body. 
        //Use POST proxy if Request Info JSON is expected to be bigger than header size limit of server
        houndifyHeaders['Hound-Request-Info'] = houndifyHeaders['Hound-Request-Info'] || req.body;

        request({
            url: "https://api.houndify.com/v1/text",
            qs: req.query,
            headers: houndifyHeaders
        }, function (err, resp, body) {
            //if there's an request error respond with 500 and err object
            if (err) return res.status(500).send(err.toString());
            
            //else send the response body from backend as it is
            res.status(resp.statusCode).send(body);
        });  
    }
}
```


<style>
  .important, .warn, .notice {
    color: white;
    padding: 6px;
    border-radius:6px;
  }

  .important {
    background: crimson;
  }
  .notice {
    background: deepskyblue;
  }
  .warn {
    background: darkgoldenrod;
  }
</style>
