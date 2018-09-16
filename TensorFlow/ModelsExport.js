//Please read TF.js documentation to under what is going on.
const tensorflowMobileNet_v_1_0_25_transferLearning = async () => {
    const model = await tf.loadModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
    const layer = model.getLayer('conv_pw_13_relu');
    console.log(layer)
    return tf.model({ inputs: model.inputs, outputs: layer.output });
}

const TansferkerasModelGenerator = (inputShape, unitsList, learningRate, outputShape, outputActivation) => {
    console.log(unitsList)
    if (inputShape[0] === null) {
        var clonedArray = [...inputShape];
        clonedArray.shift();
    }
    console.log(inputShape)
    const tfModel = { layers: [tf.layers.flatten({ inputShape: clonedArray })] }
    unitsList.map(val => {
        console.log(val)
        tfModel.layers.push(tf.layers.dense({
            units: val,
            activation: 'relu',
            kernelInitializer: 'varianceScaling',
            useBias: true
        }))
    })

    tfModel.layers.push(tf.layers.dense({
        units: outputShape,
        kernelInitializer: 'varianceScaling',
        useBias: false,
        activation: outputActivation
    }))
    console.log(tfModel)
    const model = tf.sequential(tfModel)
    const optimizer = tf.train.adam(learningRate);
    model.compile({ optimizer: optimizer, loss: 'categoricalCrossentropy' });
    return model;
}

const MobileNetTransferLearningPractice = (num)=>{
    return tensorflowMobileNet_v_1_0_25_transferLearning().then(Net=>{
        model = TansferkerasModelGenerator(Net.outputShape, [100, 50], 0.0001, 10, "softmax")
        return {mobile: Net, model: model};
    })
}

// prediction = async (model , trainedModel, cam, inputShape) => {
//     while (true ) {
//         const predictedClass = tf.tidy(() => {
//             const img = cam.capture(inputShape);
//             const activation = model.predict(img);
//             const predictions = trainedModel.predict(activation);
//             return predictions.as1D();
//         });
//         const classId = (await predictedClass.data());
//         console.log(classId)
//         predictedClass.dispose();
//         await tf.nextFrame();
//     }
// }
