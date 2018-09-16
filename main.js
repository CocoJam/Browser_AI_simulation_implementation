//Threaded workers.
var worker = new Worker("./ammo.worker.js")
var fastWorker 
fastWorker = new Worker("./fast.worker.js")
//Switch of using WebAssembly.
var isWasm = true;
// var timer = undefined;
// var time = 0;
// var then = 0;
// var delta = 0;
// var timestep = 1 / 60;
// var timerate = timestep * 1000;

//Dynamic memory book keeping object.
var MemoryFree = {}
//Bookkeeping keeps object id and object information length
//Not in use
// var bookKeeping = new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * 100000); // 100000 
// var bookKeepingUint8 = new Uint8Array(bookKeeping);

//SharedInfoArray keeps each object's basic info like position velocity length and quat.
//This is shared with the ammo.worker.js.
var sharedInfoArray = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * 100000); // 100000 
var sharedInfoArrayFloat32 = new Float32Array(sharedInfoArray);

//PointerArray is pointing slot number of current sharedInfoArray for pointerArray[0],
//PointerArray[1] is a pointer for the location of bookKeeping, but since bookKeeping is not in use hence [1] is not used.
//This is shared with the ammo.worker.js
var pointer = new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * 2);
var pointerArray = new Uint32Array(pointer);

//sharedImageArray that will be used to obtain and shard image pixel values such as video input stream for FAST algrothium usage or other image processing.
var sharedImageArray = new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * window.innerHeight * window.innerWidth * 4);
var sharedImageArrayUint8 = new Uint8Array(sharedImageArray);

//locationArray is a shared between fast.worker.js to share the 2d festure detected averaged X and Y position for controlers. 
//Slot allocation [0] the mesh selected id, Then followed by 7 slots of general information.
var locationArray = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * 8);
var locationArrayFloat32 = new Float32Array(locationArray);
locationArrayFloat32[0]= -1;
locationArrayFloat32[2] = 10;

//Blob for detecting file path for fetching in workers
blob = document.location.href.replace(/\/[^/]*$/, "/") + (isWasm ? "./builds/ammo.wasm.js" : "./builds/ammo.js");
//General set up for physics for ammo.worker.js
var setting = { type: "init", blob: blob, settings: { gravity: [0, -9.8, 0] }, sharedInfoArrayFloat32: sharedInfoArrayFloat32, pointerArray: pointerArray, locationArrayFloat32: locationArrayFloat32 }
worker.postMessage(setting)

var controler;
var cameraTF;
//Worker's responds from ammo.worker.js
worker.onmessage = function (event) {

    switch (event.data.m) {
        //Responds of ammo.worker.js after the physics environment had been set up.
        case "init":
            //Init the three.js functions and environment for rendering
            initThree();
            cameraTF = new TfCamera();
            cameraTF.init()
            //Init the environment for Fast 2d detection to work
            initFast();
            //Init Fast 2d detections object.
            // var fast = new FastWorker(renderer.domElement, cameraTF.getVideo(), fastWorker, sharedImageArrayUint8, locationArrayFloat32, 5)
            //Predefined sandBox set up.
            init();
            //Init the rendering loop with request animation frames.
            animate();
            //TF neural network here.
            var modelTF = new TensorFlowCamModel(cameraTF);
            // fillBall()

            //Mouse event used to shoot sphere into the set direction, this is the event part.
            renderer.domElement.addEventListener('mousedown', function (event) {
                console.log("click")
                if (!clickRequest) {
                    mouse.set(
                        (event.clientX / window.innerWidth) * 2 - 1,
                        - (event.clientY / window.innerHeight) * 2 + 1
                    );
                    clickRequest = true;
                }

            }, false);

            addRigid({ controler: true,  mass: 100, type: "box",  position: [0, 0, 0], quat: [0, 0, 0, 1], size: [10, 10, 10] }, new THREE.MeshNormalMaterial())

            break;
        //Responds from ammo.worker.js to request delete object from the rendering, usually after
        //the requested object had been deleted from the physics engine.
        case "delete":
            MeshTypeSelect(event.data, ThreeFree);
            break;
        //Responds from ammo.worker.js to request for object id change, but this is currently no
        //use hence it is ok to ignore.
        case "idChange":
            MeshTypeSelect(event.data, switchId);
            break;
    }
}

// fastWorker.onmessage = function (event) {
//     switch (event.data.m) {
//         case "fastInit":
//             //Can form controlers from here;
//             console.log("fastInit")
//             console.log(event)
//             addRigid({ controler: true,  mass: 100, type: "box",  position: [0, 0, 0], quat: [0, 0, 0, 1], size: [10, 10, 10] }, new THREE.MeshNormalMaterial())
//             break;
//     }
// }

//Starting the sandBox environment.
function init() {
    controlerSelectionEvironment()
    sandBoxSetUp()
}

//Set up.
function controlerSelectionEvironment() {
    //Bound of the box
    addRigid({ type: "box", position: [0, 100, 50.5], quat: [0, 0, 0, 1], size: [100, 20, 1] }, new THREE.MeshNormalMaterial())
    addRigid({ type: "box", position: [0, 100, -50.5], quat: [0, 0, 0, 1], size: [100, 20, 1] }, new THREE.MeshNormalMaterial())
    addRigid({ type: "box", position: [50.5, 100, 0], quat: [0, 0, 0, 1], size: [1, 20, 100] }, new THREE.MeshNormalMaterial())
    addRigid({ type: "box", position: [- 50.5, 100, 0], quat: [0, 0, 0, 1], size: [1, 20, 100] }, new THREE.MeshNormalMaterial())
    //Material setting for three.js mesh, the bottom side of the gound is rending current video.
    //This is a workaround from other form of high CPU and GPU cross-over to get pixel values
    //This prevented addition high overhead processing power and memory foot-print within GPU and CPU.
    var materials = [
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 }),        // Left side
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 }),       // Right side
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 }),         // Top side
        videoMaterial,      // Bottom side
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 }),       // Front side
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 })         // Back side
    ];
    // new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 })
    //The Ground
    addRigid({ name: "ground", type: "box", position: [0, 90, 0], quat: [0, 0, 0, 1], size: [100, 1, 100], texture: "./Asset/grass_texture_by_deathlyrain.jpg" }, materials)
    //The testing box to check for sanity.
    // addRigid({ type: "box", mass: 1, position: [0, 100, 0], quat: [0, 0, 0, 1], size: [10, 10, 10] }, new THREE.MeshNormalMaterial())
}


//Set up.
function sandBoxSetUp() {
    //Bound of the box
    addRigid({ type: "box", position: [0, 10, 50.5], quat: [0, 0, 0, 1], size: [100, 20, 1] }, new THREE.MeshNormalMaterial())
    addRigid({ type: "box", position: [0, 10, -50.5], quat: [0, 0, 0, 1], size: [100, 20, 1] }, new THREE.MeshNormalMaterial())
    addRigid({ type: "box", position: [50.5, 10, 0], quat: [0, 0, 0, 1], size: [1, 20, 100] }, new THREE.MeshNormalMaterial())
    addRigid({ type: "box", position: [- 50.5, 10, 0], quat: [0, 0, 0, 1], size: [1, 20, 100] }, new THREE.MeshNormalMaterial())
    //Material setting for three.js mesh, the bottom side of the gound is rending current video.
    //This is a workaround from other form of high CPU and GPU cross-over to get pixel values
    //This prevented addition high overhead processing power and memory foot-print within GPU and CPU.
    var materials = [
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 }),        // Left side
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 }),       // Right side
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 }),         // Top side
        videoMaterial,      // Bottom side
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 }),       // Front side
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 })         // Back side
    ];
    // new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 })
    //The Ground
    addRigid({ name: "ground", type: "box", position: [0, 0, 0], quat: [0, 0, 0, 1], size: [100, 1, 100], texture: "./Asset/grass_texture_by_deathlyrain.jpg" }, materials)
    //The testing box to check for sanity.
    // addRigid({ type: "box", mass: 1, position: [0, 100, 0], quat: [0, 0, 0, 1], size: [10, 10, 10] }, new THREE.MeshNormalMaterial())
}

//Mesh type driven functions to swtich callbacks to different list.
function MeshTypeSelect(data, func) {
    const o = data.o;
    switch (o.MeshType) {
        case "Rigid":
            func(rigidBodies, o);
            break;
        case "Controler":
            func(controlerBodies, o);
            break;
    }
}

//The delete function for THREE.js environment.
function ThreeFree(list, o) {
    const obj = list[o.id || o]
    scene.remove(obj)
    if (obj.geometry)
        obj.geometry.dispose();
    if (obj.material)
        obj.material.dispose();
    if (obj.mesh)
        obj.mesh.dispose();
    if (obj.texture)
        obj.texture.dispose();
    delete list[o.id || o]
    //Book keeping for what had been deleted for dynamic allocation of memory.
    MemoryFree[o.id] = o.slotNum;
}

//Not in use plz ignore.
function switchId(list, o) {
    const obj = list[o.from]
    console.log(o.from)
    console.log(o.to)
    // console.log(obj)
    obj.MeshId = o.to
}



//Mouse event used to shoot sphere into the set direction, this is the logic and processing part.
function processClick() {
    if (clickRequest) {
        raycaster.setFromCamera(mouse, camera);
        var ballMass = 30;
        var ballRadius = 5;
        pos.copy(raycaster.ray.direction);
        pos.add(raycaster.ray.origin);
        var position1 = new Float32Array(3)
        pos.toArray(position1, 0);

        var velocity = new Float32Array(3)
        pos.copy(raycaster.ray.direction);
        pos.multiplyScalar(20);
        pos.toArray(velocity, 0);

        ThreeMeshCreateByJSON({
            type: "sphere", size: [ballRadius], mass: ballMass, position: position1,
            quat: [0, 0, 0, 1],
            friction: 0.5, LinearVelocity: velocity
        },
            new THREE.MeshNormalMaterial({ color: 0xffff00 }))
        clickRequest = false;
    }

}

//Stress test method to test FPS and CPU/GPU usage
var counter = 0;
function fillBall() {
    requestAnimationFrame(fillBall)
    ThreeMeshCreateByJSON({ type: "box", mass: 10, position: [0, 1000, 0], quat: [0, 0, 0, 1], size: [10, 10, 10] }, new THREE.MeshNormalMaterial())
    counter++;
    console.log(counter)
}

//RayTracing based method, currently not in use plz ignore.
var RayTraced = null;
var RayTracedMesh = null;
function CanvusOnMouseMove(event) {
    console.log("Move")
    event.preventDefault();

    mouse.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        - (event.clientY / window.innerHeight) * 2 + 1
    // event.clientX,event.clientY
    );
    //Mouse controls instead
 
    raycaster.setFromCamera(mouse, camera);
    var intersections = raycaster.intersectObjects(rigidBodies);
    // console.log(mouse)
    if (intersections[0] && intersections[0].object.name === "ground") {
        console.log(intersections[0].object)
        // locationArrayFloat32[1] = mouse.x*100
        // locationArrayFloat32[3] = -(mouse.y*100)
    
        // locationArrayFloat32[2] = intersections[0].object.position.y
        
        locationArrayFloat32[1] = intersections[0].point.x
        locationArrayFloat32[2] = intersections[0].point.y+10
        locationArrayFloat32[3] = intersections[0].point.z
        // if (RayTracedMesh === null) {
        //     console.log("RAYTrace")
        //     RayTracedMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshNormalMaterial());
        //     RayTracedMesh.position.set(locationArrayFloat32[0], 10,locationArrayFloat32[1])
        //     scene.add(RayTracedMesh)
        //     rigidBodies.push(RayTracedMesh)
        // }
        // if (RayTraced !== intersections[0] && RayTraced !== null) {
        //     console.log("intersects")
        //     RayTraced.object.material = RayTraced.object.material_
        //     RayTraced = intersections[0];
        //     intersections[0].object.material_ = intersections[0].object.material;
        //     intersections[0].object.material = new THREE.LineBasicMaterial({
        //         color: 0xffffff,
        //         linewidth: 1,
        //         linecap: 'round',
        //         linejoin: 'round'
        //     });
        // } else if (RayTraced === null) {
        //     RayTraced = intersections[0];
        //     intersections[0].object.material_ = intersections[0].object.material;
        //     intersections[0].object.material = new THREE.LineBasicMaterial({
        //         color: 0xffffff,
        //         linewidth: 1,
        //         linecap: 'round',
        //         linejoin: 'round'
        //     });
        // }
        // // RayTracedMesh.position.copy(intersections[0].object.position)
        // RayTracedMesh.position.set(mouse.x * 10, 10, -mouse.y * 10)

        // console.log(intersections[0])
    }
}

THREE.Raycaster.prototype.intersectObjects = function ( objects, recursive, optionalTarget ) {
    var intersects = optionalTarget || [];
    if(typeof objects === "object"){
        for ( var i in objects) {
            intersectObject( objects[ i ], this, intersects, recursive );
        }
        intersects.sort( ascSort );
        return intersects;
    }
    
    if ( Array.isArray( objects ) === false ) {
        console.warn( 'THREE.Raycaster.intersectObjects: objects is not an Array.' );
        return intersects;
    }

    for ( var i = 0, l = objects.length; i < l; i ++ ) {
        intersectObject( objects[ i ], this, intersects, recursive );
    }

    intersects.sort( ascSort );
    return intersects;
}

function intersectObject( object, raycaster, intersects, recursive ) {

    if ( object.visible === false ) return;
    object.raycast( raycaster, intersects );
    if ( recursive === true ) {
        var children = object.children;
        for ( var i = 0, l = children.length; i < l; i ++ ) {

            intersectObject( children[ i ], raycaster, intersects, true );

        }
    }
}

function ascSort( a, b ) {

    return a.distance - b.distance;

}
document.addEventListener("mousemove", CanvusOnMouseMove, false)