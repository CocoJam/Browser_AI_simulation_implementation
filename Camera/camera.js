class TfCamera {
    constructor() {
        this.video = document.createElement("video");
        this.heigh = this.video.setAttribute("height", window.innerHeight)
        this.width = this.video.setAttribute("width", window.innerWidth)
    }

    init() {
        navigator.getUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia;
        navigator.getUserMedia({
            video: true, audio: {
                optional: [],
                mandatory: {
                    googEchoCancellation: true
                }
            }
        }, (stream) => {
            var source = window.URL.createObjectURL(stream);
            console.log(source)
            window.source = source;
            this.video.src = source
            this.video.onloadedmetadata = function (e) {
                this.play();
                this.muted = true;
            };
            console.log(this.video)
            // var imageCapture = new ImageCapture(stream.getVideoTracks()[0]);
            // console.log(imageCapture)
            // console.time("camera")
            // offScreemCanvasWorker.postMessage(stream)
            // imageCapture.grabFrame().then(function (imageBitmap) {
            //     console.timeEnd("camera")

            //     console.log('Grabbed frame:', imageBitmap);
            //     // canvas.classList.remove('hidden');
            // }).catch(function (error) {
            //     console.log('grabFrame() error: ', error);
            // });
        }, function (e) {
            console.error(e);
        });
    }

    getVideo() {
        return this.video;
    }
    capture(inputSize) {
        return tf.tidy(() => {
            const webcamImage = tf.fromPixels(this.video);
            // const arr = Array.from(webcamImage);
            // webcamImage.data().then(val => val)
            const resizedImage = tf.image.resizeBilinear(webcamImage, inputSize)
            const batchedImage = resizedImage.expandDims(0);
            return { batchedImage: batchedImage.toFloat().div(tf.scalar(127)).sub(tf.scalar(1)), webcamImage: webcamImage };
        });
    }
}

// function TfCamera() {
//     video = document.createElement("video");
//     heigh = video.setAttribute("height", window.innerHeight)
//     width = video.setAttribute("width", window.innerWidth)
// }
// TfCamera.prototype.init = function(){

// }

// TfCamera.prototype.getVideo = function(){
//     console.log(this.video)
//     return this.video;
// }

// TfCamera.prototype.capture = function(inputSize){
//     return tf.tidy(() => {
//         console.log(video)
//         const webcamImage = tf.fromPixels(video);
//         const resizedImage = tf.image.resizeBilinear(webcamImage, inputSize)
//         const batchedImage = resizedImage.expandDims(0);
//         return batchedImage.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
//     });
// }
