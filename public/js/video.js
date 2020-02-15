// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image
var button = document.getElementById("button")
var video_thread = document.getElementById("webcam-container")
// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/feOWq1oh/";
const URL2 = "https://teachablemachine.withgoogle.com/models/wpWWbiOL/"

let model, webcam, labelContainer, maxPredictions;
let model2, labelContainer2, maxPredictions2;

// Load the image model and setup the webcam
async function init() {
    button.style.display = "none";
    video_thread.style.border = "10px solid #ddd";
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    const model2URL = URL2 + "model.json";
    const metadata2URL = URL2 + "metadata.json";
    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds "tmImage" object to your window (window.tmImage)

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    model2 = await tmImage.load(model2URL, metadata2URL);
    maxPredictions2 = model2.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmImage.Webcam(350, 350, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append elements to the DOM
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container2");
    // for (let i = 0; i < maxPredictions; i++) { // and class labels
       new_elem = document.createElement("div")
       new_elem.style.float = "left";
        labelContainer.appendChild(new_elem);
    //}

    labelContainer2 = document.getElementById("label-container")
    // for (let i = 0; i < maxPredictions2; i++) { // and class labels
      new_elem = document.createElement("div")
       new_elem.style.float = "left";
      labelContainer2.appendChild(new_elem);
    //}
}

async function loop() {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

// run the webcam image through the image model
async function predict() {
    // predict can take in an image, video or canvas html element
    const prediction = await model.predict(webcam.canvas);
    prob = []
    for (let i = 0; i < maxPredictions; i++) {
        prob.push(prediction[i].probability)
    }
    k = Math.max(...prob)
    m = prob.indexOf(k)
    labelContainer.childNodes[0].innerHTML = "You should put it into <span>" + prediction[m].className + "</span>"

    const prediction2 = await model2.predict(webcam.canvas);
    prob = []
    for (let i = 0; i < maxPredictions2; i++) {
        prob.push(prediction2[i].probability)
    }
    k = Math.max(...prob)
    m = prob.indexOf(k)
    labelContainer2.childNodes[0].innerHTML = "I believe this is a <span>" + prediction2[m].className +"</span>"
}
