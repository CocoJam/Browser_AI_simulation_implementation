class TensorFlowCamModel {
    constructor(TFcamera) {
        this.TFcamera = TFcamera;
        this.TFcamera.init();
        this.input = [];
        this.labels = [];
        MobileNetTransferLearningPractice().then(net => {
            this.mobile = net.mobile;
            this.model = net.model;
            this.prediction([224, 224])
        });
    }


    async  prediction(inputShape) {
        while (true) {
            if(fastWorker){
                fastWorker.postMessage({type:"step"})
                picker()
            }
            const predictedClass = tf.tidy(() => {
                const img = this.TFcamera.capture(inputShape);
                const activation = this.mobile.predict(img.batchedImage);
                const predictions = this.model.predict(activation);
                return predictions.as1D();
            });
            const classId = (await predictedClass.data());
            // console.log(classId)
            predictedClass.dispose();
            await tf.nextFrame();
        }
    }

    setFast(fast){
        this.fast = fast;
    }

    setLabels(labels) {
        this.labels = labels;
    }
    capture(label) {
        let camera = this.TFcamera;
        let model = this.mobile;
        const result = tf.tidy(() => {
            const cap = camera.capture([224, 224])
            var re = model.predict(cap);
            return re
        })
        this.input.push(result);
        this.labels.push(label)
        this.fast.predict()
    }
    async training() {
        if (this.mobile !== undefined && this.model !== undefined && this.labels > 1) {
            const classNum = (new Set(this.labels)).size;
            const oneHot = tf.tidy(() => tf.oneHot(tf.tensor1d(this.labels).toInt(), classNum));

            const model = TansferkerasModelGenerator(this.model.outputShape, [100, 50], 0.0001, classNum, "softmax")
            const imageInput = tf.concat2d(this.input);
            var batchSize = Math.floor(imageInput.shape[0] * 0.4);
            if (batchSize < 2) {
                batchSize = imageInput.shape[0]
            }
            const epochs = 50;
            await model.fit(imageInput, oneHot, {
                batchSize,
                epochs: epochs,
                callbacks: {
                    onBatchEnd: async (batch, logs) => {
                        console.log(logs.loss.toFixed(5))
                        await tf.nextFrame();
                    }
                }
            });
            console.timeEnd("training")
            console.log("done");
            imageInput.dispose();
        }
    }
}



// TensorFlowCamModel.prototype.setModels = function (mobile, model) {
//     this.mobile = mobile;
//     this.model = model;
//     this.labels = 1;
//     console.log("set Models")
//     this.capture(1)
// }
