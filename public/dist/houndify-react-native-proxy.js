const Houndify = require("../index");
const { Writer } = require("wav");

let clientId;
let clientKey;

/**
 * We use this function to provide the router to the host app, while also initialzing the clientId and clientKey.
 * @param {string} _clientId The user's houndify client ID
 * @param {string} _clientKey The user's houndify client Key.
 *
 * @return {Router} Express Router
 */
const createReactNativeProxy = (express, _clientId, _clientKey) => {
  clientId = _clientId;
  clientKey = _clientKey;
  const router = express.Router();
  initRoutes(router);
  return router;
};

const initRoutes = (router) => {
  /**
   * Route all websocket request, which are for audio, to this handler.
   * */

  router.ws("/", (ws, res) => {
    let conversationState = {};
    let requestInfo = undefined;

    // We want to track when the websocket closes so we don't try to send requests.
    let closed = false;
    const safeSend = message => {
      if (!closed) {
        ws.send(message);
      }
    };

    /**
     * Eventually voice request will be the houndify request object.
     * We'll use it to pipe chunks to the server.
     * We predeclare it because it can't be sent until we get config information from the client.
     * But the WAV writer starts writing a header before we get audio data.
     * So we buffer the header and push it as soon as we configure.
     */
    let wavBuffer = undefined;
    let voiceRequest = {
      write: data => {
        wavBuffer = data;
      }
    };

    /**
     * Send a houndify voice request with the streamed voice data.
     * We put this in a function because we're waiting for the client to
     * send over CONFIG information. When that's recieved, this will be called.
     */

    const sendRequest = () => {
      if (requestInfo === undefined) {
        safeSend(errorObject("requestInfo has not been configured."));
        safeSend(doneCommandObject());
      }

      voiceRequest = new Houndify.VoiceRequest({
        clientId,
        clientKey,
        sampleRate: 16000,
        convertAudioToSpeex: false,

        /**
         * Allows the client to send custom requestInfo and conversationState.
         */
        requestInfo,
        conversationState,

        // Forward these events straight to the client.
        onTranscriptionUpdate: transcript =>
          safeSend(transcriptionObject(transcript)),
        onResponse: (response, info) => safeSend(responseObject(response)),
        onError: (error, info) => {
          safeSend(errorObject(error));
          console.dir(error);
        }
      });

      // Push any wav data that was buffered before sending request.
      outputWriteStream.push(wavBuffer);
    };

    /**
     * This writes the incoming PCM data to WAV.
     */
    const outputWriteStream = new Writer({ channels: 1, sampleRate: 16000 });
    /**
     * Take each chunk of converted WAV data and send it to houndify.
     */
    outputWriteStream.on("data", data => voiceRequest.write(data));

    /**
     * Handle socket events.
     */
    ws.on("message", msg => handleMessage(msg));
    ws.on("close", () => {
      voiceRequest.end();
      closed = true;
    });

    /**
     * Handles incoming messages from the client.
     * The can be data chunks or commands, both packed using JSON.
     * @param {string} msg This is a stringified object with 'type' and 'data' properties.
     */
    const handleMessage = msg => {
      const message = JSON.parse(msg);
      switch (message.type) {
        case "DATA":
          /**
           * Push a new chunk of base64 PCM data to the writer for WAV conversion.
           */
          const outputBuffer = Buffer.from(message.data, "base64");
          /**
           * We also calculate the volume on server, cause it may be useful.
           * We do this by converting the chunk to a float array and calculating an RMS across the chunk.
           */
          const volume = calculateRMSFromPCMBuffer(outputBuffer);
          /**
           * Send volume and push PCM
           */
          safeSend(volumeObject(volume));
          outputWriteStream.push(Buffer.from(message.data, "base64"));
          break;
        case "COMMAND":
          if (message.data === "DONE") {
            voiceRequest.end();
          }
          break;
        case "CONFIG":
          /**
           * If it was sent, set needed CONFIG info and start a Houndify Request.
           */
          requestInfo = message.data.requestInfo || requestInfo;
          conversationState =
            message.data.conversationState || conversationState;
          sendRequest();
      }
    };
  });
};

/**
 * A set of functions to help create socket responses.
 */

/**
 * Create a response with the to-date transcription from houndify.
 * @param {{PartialTranscript}} transcript
 * @returns {string}
 */
const transcriptionObject = transcript =>
  JSON.stringify({
    type: "TRANSCRIPTION",
    data: transcript.PartialTranscript
  });

/**
 * The response object from houndify.
 * @param {*} response
 * @returns {string}
 */
const responseObject = response =>
  JSON.stringify({ type: "RESPONSE", data: response });

/**
 * Create a response instructing the client to stop recording and close the socket.
 * @returns {string}
 */
const doneCommandObject = () =>
  JSON.stringify({ type: "COMMAND", data: "DONE" });

/**
 * Create a response with a new chunk for the client.
 * @param {float} volume
 */
const volumeObject = volume => JSON.stringify({ type: "VOLUME", data: volume });
/**
 * Send houndify error message to client.
 * @param {*} error
 */
const errorObject = error => JSON.stringify({ type: "ERROR", data: error });

/**
 * Other Utilities
 */

/**
 * This lets us get the average volume for a chunk of audio.
 * @param {Int16Buffer} buffer
 */
const calculateRMSFromPCMBuffer = buffer => {
  const len = buffer.length;
  let rms = 0;
  for (let i = 0; i < len; i++) {
    rms += ((buffer[i] - 128) / 128.0) ^ 2;
  }
  rms /= len;
  rms = Math.sqrt(rms);
  return rms;
};

module.exports = createReactNativeProxy;
