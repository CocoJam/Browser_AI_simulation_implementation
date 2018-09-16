class FastWorker {
    constructor(cxt, video, worker,sharedImageArrayUint8, locationArrayFloat32 ,threshold) {
        window.cxt= cxt;
        this.cxt = document.createElement("canvas").getContext("2d")
        this.video = video;
        this.img_u8 = new jsfeat.matrix_t(video.width, video.height, jsfeat.U8_t | jsfeat.C1_t);
        // this.threshold = threshold
        this.corners = [];
        blob = document.location.href.replace(/\/[^/]*$/, "/") + ("./jsFeat/jsfeat-min.js");
        var o = { type: "fastInit", blob: blob, FastKeepingUint8: sharedImageArrayUint8, width: this.video.width, height: this.video.height, locationArrayFloat32:locationArrayFloat32, threshold: threshold }
        worker.postMessage(o)
    }

    detection() {
            this.cxt.drawImage(this.video, 0, 0, this.video.width, this.video.height);
            var imageData = this.cxt.getImageData(0, 0, this.video.width, this.video.height);
            this.FastKeepingUint8.set(imageData.data,0);
    }

    getFastKeepingUin8() {
        return this.FastKeepingUint8;
    }

    positions(count, step) {
        var pix = (0xff << 24) | (0x00 << 16) | (0xff << 8) | 0x00;
        for (var i = 0; i < count; ++i) {
            var x = this.corners[i].x;
            var y = this.corners[i].y;
            var off = (x + y * step);
            img[off] = pix;
            img[off - 1] = pix;
            img[off + 1] = pix;
            img[off - step] = pix;
            img[off + step] = pix;
        }
    }
}