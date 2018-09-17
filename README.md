# Browser_AI_simulation_implementation

This is a project majorly based on JavaScript implementation, yet a large amount of C++ code is included as compiled as WASM (WebAssembly) through the use of Emscripten.

There are several aspects of this project:
3D js rendering engine: by Three.js
Physics engine: by WASM version of bullet/ Ammo.js
Neural network: by TensorflowJs
Image Processing: by JSFeat

The idea behind this project consists of two major purposes:

Firstly:
To produce a more realistic simulation within the browser, which could be universally reached and highly performed calculation. This would allow more simple interactivity for the given user (Example through the camera by feature extraction NN for classification and 2D feature for estimating location). This purpose is greatly inspired by the Teachable Machine demo from TensorflowJS, but with more effort to provide a more complex interaction and responds for users.

Secondly:
To produce a platform for where AI interested individual could access simulation, which addresses the recent increase in web performance and portability of native code through WASM. This would likely allow bringing more development towards developing agents, which could be simulated by this simulator and improve upon or for demonstration purpose.

Currently, the general structure of the program consists of 3 individual thread. Yes, Javascript can have threads as web workers (Still waiting for Threading to be a thing in WASM). This includes UI thread (containing Three.js, TensorflowJs and WebRTC), Bullet thread (All physics related things) and the Fast thread (Anything related to image processing). These threads communicate through postMessages, while maintaining memory allocation and position/ information between the threads by shareArrayBuffers.

Fair warning:
Please check do you have a good or some form of understanding of memory management, web assembly, C++, Emscripten, JavaScript + ES6, Web workers, async JavaScript, Python, 3D rendering, Physics engine controls, GPU programming and GLSL. Extra requires to include entry level of image processing and neural networks.

If not please read them up. This version of the project was made within matters of 2  weeks from learning everything needed to this state of the first commit.
