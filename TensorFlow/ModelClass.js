class TensorFlowCamModel {
    constructor(TFcamera) {
        this.TFcamera = TFcamera;
        // this.TFcamera.init();
        this.input = [];
        this.labelsMap = [];
        this.labels = [];
        this.mobile = undefined;
        this.predictionFlag = false;
        tensorflowMobileNet_v_1_0_25_transferLearning().then(net => {
            this.mobile = net
        });
    }


    async  prediction(inputShape) {
        this.predictionFlag = true;
        while (true) {
            if (fastWorker) {
                // console.log("fast step")
                fastWorker.postMessage({ type: "step" })
                picker()
            }
            const predictedClass = tf.tidy(() => {
                const img = this.TFcamera.capture(inputShape);
                const activation = this.mobile.predict(img.batchedImage);
                const predictions = this.model.predict(activation);
                return predictions.as1D().argMax();
            });
            const classId = (await predictedClass.data());
            console.log(classId[0])
            locationArrayFloat32[0] = this.labelsMap[classId[0]]
            predictedClass.dispose();
            await tf.nextFrame();
        }
    }

    setFast(fast) {
        this.fast = fast;
    }

    setLabels(labels) {
        this.labels = labels;
    }
    capture(label) {
        if (!this.predictionFlag) {
            let camera = this.TFcamera;
            let model = this.mobile;
            const result = tf.tidy(() => {
                const cap = camera.capture([224, 224])
                var re = model.predict(cap.batchedImage);
                return re
            })
            this.input.push(result);
            if (!this.labelsMap.includes(label)) {
                this.labelsMap.push(label)
            }
            this.labels.push(this.labelsMap.indexOf(label))
            console.log(this.labels)
            console.log(this.input)
        }

        // this.labels.push(label)
        // this.fast.predict()
    }
    async training() {
        if (!this.predictionFlag) {
            console.log(this.labelsMap.length)
            console.log("train init")
            const classNum = (new Set(this.labels)).size;
            console.log(classNum)
            // this.model = TansferkerasModelGenerator(this.mobile.outputShape, [100, 50], 0.0001, classNum, "softmax")
            if (this.mobile !== undefined && this.labelsMap.length > 1) {
                console.log("train init")

                const oneHot = tf.tidy(() => tf.oneHot(tf.tensor1d(this.labels).toInt(), classNum));

                this.model = TansferkerasModelGenerator(this.mobile.outputShape, [100, 50], 0.0001, classNum, "softmax")
                const imageInput = tf.concat2d(this.input);
                var batchSize = Math.floor(imageInput.shape[0] * 0.4);
                if (batchSize < 2) {
                    batchSize = imageInput.shape[0]
                }
                const epochs = 50;
                console.log("fit")
                await this.model.fit(imageInput, oneHot, {
                    batchSize,
                    epochs: epochs,
                    callbacks: {
                        onBatchEnd: async (batch, logs) => {
                            console.log(logs.loss.toFixed(5))
                            await tf.nextFrame();
                        }
                    }
                });
                // console.timeEnd("training")
                console.log("done");
                this.prediction([224, 224])
                imageInput.dispose();
            }
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
