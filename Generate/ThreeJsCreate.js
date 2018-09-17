//Methods to check for GPU/webGL access
if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
    document.getElementById('container').innerHTML = "";
    alert("no webgl")
}

//Global access var.
var container, stats, clock, video;
var camera, scene, renderer, controls, textureLoader, mouse, raycaster, clickRequest, mouse;
var camera2, scene2, controls2, renderer2, pickingTexture;
var rigidBodies = {};
var controlerBodies = {};
var pos = new THREE.Vector3();
var color = new THREE.Color();


var quat = new THREE.Quaternion();
var plane;
var videoMaterial;

var pointerToggle = false
var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

//Init of three js environments;
function initThree() {
    scene = new THREE.Scene();
    var container = document.getElementById('container');
    stats = new Stats();
    container.appendChild(stats.dom);
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 100;
    camera.position.y = 100;
    camera.quaternion._w = 0.707107134873297;
    camera.quaternion._x = 0.707107134873297;
    camera.quaternion._y = -9.199765101715551e-17;
    camera.quaternion._z = -9.199765101715551e-17;

    // controls =new THREE.PointerLockControls(camera)
    controls = new THREE.OrbitControls(camera);

    controlsPoint = new THREE.PointerLockControls(camera);
    scene.add(controlsPoint.getObject());

    textureLoader = new THREE.TextureLoader();
    mouse = new THREE.Vector2();
    raycaster = new THREE.Raycaster();
    window.ray = raycaster
    clock = new THREE.Clock();
}


//Set up for Fast.worker.js interacting environment.
function initFast() {

    pickingTexture = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    pickingTexture.texture.minFilter = THREE.LinearFilter;
    // scene2 = new THREE.Scene();
    // var container = document.getElementById('container2');
    // stats = new Stats();
    // container.appendChild(stats.dom);
    // renderer2 = new THREE.WebGLRenderer();
    // renderer2.setPixelRatio(window.devicePixelRatio);
    // renderer2.setSize(window.innerWidth / 2, window.innerHeight / 2);
    // container.appendChild(renderer2.domElement);

    camera2 = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        1000
    )
    camera2.quaternion._w = 0.7265036454192669
    camera2.quaternion._x = 0.7071064276173534
    camera2.quaternion._y = 2.0116819685735257e-16
    camera2.quaternion._z = -2.0116799568031455e-16
    camera2.position.z = 15
    camera2.position.x = 7.746394932918448e-20;
    camera2.position.y = -136.13701744305015;
    // camera2.position.z =0.00013614306861797548;
    // controls2 = new THREE.OrbitControls(camera2);


    // document.body.appendChild(renderer2.domElement)
    // document.body.appendChild(cameraTF.getVideo())
    var videoTexture = new THREE.VideoTexture(cameraTF.getVideo());
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat;
    videoTexture.generateMipmaps = false;


    videoMaterial = new THREE.MeshBasicMaterial({
        map: videoTexture
    });

    // var planeGeometry = new THREE.PlaneGeometry(cameraTF.getVideo().width / 150,cameraTF.getVideo().height/ 150, 1);
    // var plane = new THREE.Mesh(planeGeometry, videoMaterial);

    // scene2.add(plane)
    // console.log(cameraTF.getVideo();
}


function ThreeMeshCreate(position, quat, size, type, material, mass) {
    return addRigid({ position: position, type: type, quat: quat, size: size, mass: mass }, material)
}
function ThreeMeshCreateByJSON(o, material) {
    return addRigid(o, material)
}

//Attempting for dynamic memory management.
function MemoryCache(MemoryFree, slotNum) {
    var address = null;
    for (var i in MemoryFree) {
        if (MemoryFree[i] === slotNum) {
            address = i;
            delete MemoryFree[i]
            break;
        }
    }
    return address;
}

//Adding rendering object method for Three.js to add rigid objects.
function addRigid(o, material) {
    let threeObject;
    //Attempting for dynamic memory management.
    let address = MemoryCache(MemoryFree, 8);

    switch (o.type) {
        case "plane":
            threeObject = new THREE.Mesh(new THREE.PlaneGeometry(o.size[0], o.size[1], o.size[2], o.size[3]), material);
            threeObject.material.side = THREE.SingleSide;
            console.log(threeObject.material)
            break;
        case 'box':
            threeObject = new THREE.Mesh(new THREE.BoxGeometry(o.size[0], o.size[1], o.size[2], 1, 1, 1), material);
            break;
        case 'sphere':
            threeObject = new THREE.Mesh(new THREE.SphereGeometry(o.size[0], 32, 32), material);
            break;

        case 'cylinder':
            threeObject = new THREE.Mesh(new THREE.CylinderGeometry(o.size[0], o.size[1], o.size[2], 32), material);
            break;

        case 'cone':
            threeObject = new THREE.Mesh(new THREE.ConeGeometry(o.size[0], o.size[1], 32), material);
            break;

        // case 'capsule':
        //     shape = new Ammo.btCapsuleShape(o.size[0], o.size[1] * 0.5);
        //     break;
        default:
            console.error("not exsisting shape")
            break;
    }

    if (o.texture) {
        textureLoader.load(o.texture, function (texture) {
            threeObject.map = texture;
        }, undefined, function (err) {
            console.error('An error happened.');

        })
    }

    threeObject.position.fromArray(o.position)
    threeObject.quaternion.fromArray(o.quat)
    threeObject.rotation.fromDegree(o.rotation)

    if (o.name) {
        threeObject.name = o.name;
    }

    threeObject.quaternion.toArray(o.quat, 0)
    threeObject.position.toArray(o.position, 0)
    threeObject.slotNum = 8;

    if (address === null) {
        // console.log("Memory Buffer not hit")
        address = pointerArray[0]
        address = parseInt(address);
        pointerArray[0] += threeObject.slotNum;
    }

    threeObject.MeshId = address
    rigidBodies[address] = threeObject


    o.id = address
    o.slotNum = threeObject.slotNum;

    if (o.controler) {
        o.MeshType = "Controler";
        threeObject.MeshType = "Controler"
        console.log("controler")
        // locationArrayFloat32[0] = o.id;
    } else {
        o.MeshType = "Rigid";
        threeObject.MeshType = "Rigid"
    }

    sharedInfoArrayFloat32.set(o.position, o.id + 1)
    sharedInfoArrayFloat32.set(o.quat, o.id + 3 + 1)
    scene.add(threeObject);
    worker.postMessage({ type: "add", o: o })

    return o
}

//Rendering loop.
function animate() {
    worker.postMessage({ type: "step", clock: clock.getDelta() })
    requestAnimationFrame(animate);
    render();
    if (pointerToggle) {

        raycaster.ray.origin.copy(controlsPoint.getObject().position);
        raycaster.ray.origin.y -= 10;
        var intersections = raycaster.intersectObjects(rigidBodies);
        var onObject = intersections.length > 0;
        var time = performance.now();
        var delta = (time - prevTime) / 1000;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveLeft) - Number(moveRight);
        direction.normalize(); // this ensures consistent movements in all directions
        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;
        if (onObject === true) {
            velocity.y = Math.max(0, velocity.y);
            canJump = true;
        }
        controlsPoint.getObject().translateX(velocity.x * delta);
        controlsPoint.getObject().translateY(velocity.y * delta);
        controlsPoint.getObject().translateZ(velocity.z * delta);
        if (controlsPoint.getObject().position.y < 10) {
            velocity.y = 0;
            controlsPoint.getObject().position.y = 10;
            canJump = true;
        }
        prevTime = time;
    } else {
        controls.update();
    }
    stats.update();
}

//Just looping through rending objects for getting the accurate position based on chagnged phyiscs
//interacted positions and rotation from ammo.worker.js
function render() {
    for (var x in rigidBodies) {
        const bodys = rigidBodies[x];
        bodys.position.set(sharedInfoArrayFloat32[bodys.MeshId + 1], sharedInfoArrayFloat32[bodys.MeshId + 2], sharedInfoArrayFloat32[bodys.MeshId + 3]);
        bodys.quaternion.set(sharedInfoArrayFloat32[bodys.MeshId + 4], sharedInfoArrayFloat32[bodys.MeshId + 5], sharedInfoArrayFloat32[bodys.MeshId + 6], sharedInfoArrayFloat32[bodys.MeshId + 7]);
    }
    // rigidBodies.forEach((bodys) => {
    //     bodys.position.set(sharedInfoArrayFloat32[bodys.MeshId + 1], sharedInfoArrayFloat32[bodys.MeshId + 2], sharedInfoArrayFloat32[bodys.MeshId + 3]);
    //     bodys.quaternion.set(sharedInfoArrayFloat32[bodys.MeshId + 4], sharedInfoArrayFloat32[bodys.MeshId + 5], sharedInfoArrayFloat32[bodys.MeshId + 6], sharedInfoArrayFloat32[bodys.MeshId + 7]);
    // })
    processClick();
    renderer.render(scene, camera);
}

//This method is the workaround to get video stream pixel values.
function picker() {
    renderer.render(scene, camera2, pickingTexture);
    renderer.readRenderTargetPixels(pickingTexture, 0, 0, window.innerWidth, window.innerHeight, sharedImageArrayUint8);
}

var onKeyDown = function (event) {
    switch (event.keyCode) {
        case 38: // up
        case 87: // w
            moveForward = true;
            break;
        case 37: // left
        case 65: // a
            moveLeft = true; break;
        case 40: // down
        case 83: // s
            moveBackward = true;
            break;
        case 39: // right
        case 68: // d
            moveRight = true;
            break;
        case 32: // space
            if (canJump === true) velocity.y += 350;
            canJump = false;
            break;
        case 67: //c
            pointerToggle = !pointerToggle;
            break;
        case 13:
            randomGeneratedPickerBox(-45, -45, 45, 45, 10, false)
            randomGeneratedPickerBox(-45, -45, 45, 45, 10, false)
            randomGeneratedPickerBox(-45, -45, 45, 45, 10, false)
            randomGeneratedPickerBox(-45, -45, 45, 45, 10, false)
            break;
        case 8:
            randomGeneratedPickerBox(-45, -45, 45, 45, 100, true);
            break;
        case 16:
        console.log("train")
            modelTF.training()
            break;
    }
};

var onKeyUp = function (event) {
    switch (event.keyCode) {
        case 38: // up
        case 87: // w
            moveForward = false;
            break;
        case 37: // left
        case 65: // a
            moveLeft = false;
            break;
        case 40: // down
        case 83: // s
            moveBackward = false;
            break;
        case 39: // right
        case 68: // d
            moveRight = false;
            break;
    }
};
document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyUp, false);