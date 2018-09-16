//This class is deprecated
class Fast {
    constructor(cxt, video, threshold) {
        this.cxt = cxt
        this.video = video;
        this.img_u8 = new jsfeat.matrix_t(video.width, video.height, jsfeat.U8_t | jsfeat.C1_t);
        this.threshold = threshold
        this.corners = [];
        this.toggle = false;
        console.log(this.video)
        var i = video.width * video.height ;
        while (--i >= 0) {
            this.corners[i] = new jsfeat.keypoint_t(0, 0, 0, 0);
            console.log(this.corners[i])
        }
        console.log(this.corners)
    }


    detection() {
        console.time()
        ctx.drawImage(this.video, 0, 0, this.video.width, this.video.height);
        var imageData = ctx.getImageData(0, 0, video.width, video.height);
        console.timeEnd()
        
        jsfeat.imgproc.grayscale(imageData.data, 640, 480, this.img_u8);
        jsfeat.fast_corners.set_threshold(threshold);
        var count = jsfeat.fast_corners.detect(img_u8, corners, 5);
        // var data_u32 = new Uint32Array(imageData.data.buffer);
        this.positions(count, video.height);
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