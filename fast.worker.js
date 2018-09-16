var canvas;
var FastKeepingUint8, img_u8, threshold, jsfeat;
var locationArrayFloat32;
var imageCorners = [];
var averageX_ = 0;
var averageZ_ = 0;
var maxX_ = 0;
var maxZ_ = 0;

self.onmessage = function (event) {
    switch (event.data.type) {
        case "fastInit":
            fastInit(event.data);
            break;
        case "step":
            stepfast()
            break;
        default:
            process(event.data.image)
            break;
    }

}
console.log(self)

function fastInit(o) {
    importScripts(o.blob);
    FastKeepingUint8 = o.FastKeepingUint8;
    locationArrayFloat32 = o.locationArrayFloat32;
    img_u8 = new jsfeat.matrix_t(o.width, o.height, jsfeat.U8_t | jsfeat.C1_t);
    // console.time("corners")
    for (var i = 0; i < FastKeepingUint8.length; i++) {
        imageCorners[i] = new jsfeat.keypoint_t(0, 0, 0, 0);
    }
    // console.timeEnd("corners")

    jsfeat.fast_corners.set_threshold(o.threshold);
    jsfeat = jsfeat
    self.postMessage({ m: "fastInit" })
}
function stepfast() {
    if (jsfeat !== undefined) {
        jsfeat.imgproc.grayscale(FastKeepingUint8, 640, 480, img_u8);
        var count = jsfeat.fast_corners.detect(img_u8, imageCorners, 5);
        var averageX = 0;
        var averageZ = 0;
        for (var i = 0; i < count; ++i) {
            averageX += imageCorners[i].x / count
            averageZ += imageCorners[i].y / count
        }
        maxX_ = maxX_ < averageX ? averageX : maxX_;
        maxZ_ = maxZ_ < averageZ ? averageZ : maxZ_;

        if (averageX > 0) {
        averageX_ = averageX / maxX_ * 90 - 45
        }
        if (averageZ > 0) {
        averageZ_ = averageZ / maxZ_ * 90 - 45
        }
        //X and Z position bound is from -45 to 45 
        // locationArrayFloat32[1] = averageX_;
        // // locationArrayFloat32[2] = averageY_;
        // locationArrayFloat32[3] = averageZ_;
        console.log(locationArrayFloat32)
    }
}

// function process(data) {
//     console.log(data);
//     if (canvas !== undefined) {
//         var cxt = canvas.getContext("bitmaprender");
//         cxt.transferFromImageBitmap(data);
//         var imageData = cxt.getImageData(0, 0, this.video.width, this.video.height);
//         // console.log(imageData)
//     }

// }