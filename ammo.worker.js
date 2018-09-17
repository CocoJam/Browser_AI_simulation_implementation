var Module = { TOTAL_MEMORY: 256 * 1024 * 1024 };
//Boilerplate varibles for later usage.
var transformAux1, dispatcher, broadphase, solver,
    physicsWorld, rigidBodies = {}, controlerBodies = {}, softBodies = {},
    softBodiesInformationBuffer;
var transform, tempGravity, tempShape, tempPoition, tempQuat, localInertia
const margin = 0.05;
//Shared array between main.js and ammo.worker.js
var bookKeepingUint8, sharedInfoArrayFloat32, locationArrayFloat32;
var pointerArray;
//Dynamic memory book keeping
var MemoryFree = {};
var previousControlerHolder;
//Messages from main.js and ThreeCreate.js
self.onmessage = function (event) {
    const o = event.data.o || 0;
    switch (event.data.type) {
        //Request from main.js for init the phyics environment and with assocaited settings.
        case "init":
            init(event.data)
            break;
        //Request from ThreeCreate.js add functions to create Physics body for assoicated Mesh.
        case "add":
            add(event.data)
            break;
        //Step function calling from the ThreeCreate.js rendering/ animate function to step through
        //the phyics given delta time from preivous post.
        case "step":
            step(event.data.clock)
            break;
        //The function to add extra user controls.
        case "controler":
            addControler(event.data);
            break;
        //Request from main.js or ThreeCreate.js to delete object's physics body, current not in use.
        case "delete":
            deleteObject(event.data);
            break;
    }
}

//Init function for physics environment.
function init(o) {
    importScripts(o.blob);
    Ammo().then(ammo => {
        ammoMathPrototype();
        //Boiler plate varibles to obtain the C++ Objects informations by the phycis engine.
        transform = new Ammo.btTransform(),
            tempGravity = new Ammo.btVector3(),
            tempShape = new Ammo.btVector3(),
            tempPoition = new Ammo.btVector3(),
            tempQuat = new Ammo.btQuaternion(),
            localInertia = new Ammo.btVector3(),
            tempVelocity = new Ammo.btVector3();
        // bookKeepingUint8 = o.bookKeepingUint8;
        sharedInfoArrayFloat32 = o.sharedInfoArrayFloat32;
        pointerArray = o.pointerArray;
        locationArrayFloat32= o.locationArrayFloat32;
        previousControlerHolder = locationArrayFloat32[0]
        PhysicSetUp(o.settings.gravity);
        //To signal after the engine had been set-up.
        self.postMessage({ m: 'init' });
    });
}

//Init function for physics environment in details.
function PhysicSetUp(gravity) {

    transformAux1 = new Ammo.btTransform();
    collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    broadphase = new Ammo.btDbvtBroadphase();
    solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);

    tempGravity.fromArray(gravity, 0);
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
}
//The add function to add physics matching body with the assoicated Mesh rendering.
function add(o) {
    const MeshType = o.o.MeshType;
    switch (MeshType) {
        case ("Rigid"):
            addRigid(o);
            break;
        case ("Controler"):
            addControler(o);
            break;
    }
    // const MemoryFreedSlots = Object.values(MemoryFree).find(function(item,i){
    //     if(item === o.slotNum){
    //         return i
    //     }
    // });
    // var address;
    // if(MemoryFreedSlots){
    //     address = MemoryFree
    // }
    // addRigid(o, address)
}

function addControler(o) {
    var controler = addRigid(o);
    controler
}

//Rigid bodies adding function
function addRigid(data) {
    let o = data.o;

    let shape;
    switch (o.type) {
        case 'plane':
            tempShape.setValue(o.size[0] * 0.5, o.size[1] * 0.5, o.size[2] * 0.5, o.size[3] * 0.5);
            shape = new Ammo.btStaticPlaneShape(tempShape, 0);
            break;
        case 'box':
            tempShape.setValue(o.size[0] * 0.5, o.size[1] * 0.5, o.size[2] * 0.5);
            shape = new Ammo.btBoxShape(tempShape);
            break;

        case 'sphere':
            shape = new Ammo.btSphereShape(o.size[0]);
            break;

        case 'cylinder':
            tempShape.setValue(o.size[0], o.size[1] * 0.5, o.size[2] * 0.5);
            shape = new Ammo.btCylinderShape(tempShape);
            break;

        case 'cone':
            shape = new Ammo.btConeShape(o.size[0], o.size[1] * 0.5);
            break;

        case 'capsule':
            shape = new Ammo.btCapsuleShape(o.size[0], o.size[1] * 0.5);
            break;

        default:
            console.error("No such shape within the ammo.worker.js predefined Rigid body")
            break;
    }
    shape.setMargin(margin);

    transform.setIdentity();
    // transform.setOrigin(new Ammo.btVector3(o.position[0],o.position[1], o.position[1]));
    // transform.setRotation(new Ammo.btQuaternion(o.quat[0], o.quat[1],o.quat[2],o.quat[3]));
    let position = o.position || [0, 0, 0];
    let quat = o.quat || [0, 0, 0, 0]

    transform.setOrigin(tempPoition.fromArray(position))
    transform.setRotation(tempQuat.fromArray(quat))

    let motionState = new Ammo.btDefaultMotionState(transform);
    localInertia.setValue(0, 0, 0)

    let mass = o.mass || 0;

    shape.calculateLocalInertia(mass, localInertia);
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);

    let body = new Ammo.btRigidBody(rbInfo);

    if (o.friction) {
        rbInfo.set_m_friction(o.friction)
    }
    if (o.LinearVelocity) {
        tempVelocity.fromArray(o.LinearVelocity)
        body.setLinearVelocity(tempVelocity)
    }
    // if (mass > 0) {
    //     body.setCollisionFlags(0)
    //     body.setActivationState(1);
    // }
    let AmmoObject = { body: body, id: o.id, slotNum: o.slotNum, MeshType: o.MeshType };

    if (o.MeshType === "Rigid") {
        if (mass > 0) {
            body.setCollisionFlags(0)
            body.setActivationState(1);
        }
        rigidBodies[o.id] = AmmoObject;
    } else if (o.MeshType === "Controler") {
        if (mass > 0) {
            body.setCollisionFlags(2)
            body.setActivationState(4);
        }
        controlerBodies[o.id] = AmmoObject;
    }

    physicsWorld.addRigidBody(body)
    Ammo.destroy(rbInfo);
    return AmmoObject;
}

//Step function for the physics world and then update states for each collection of bodies.
function step(time) {
    physicsWorld.stepSimulation(time, 10);
    stepRigidBody()
    stepControlerBody()
}

function stepControlerBody(array, offset) {
    for (var x in controlerBodies) {
        const body = controlerBodies[x];
        const bodySlot = body.id;
        

        if( previousControlerHolder !== -1 && previousControlerHolder !== locationArrayFloat32[0]){
            console.log("not matching")
            console.log(previousControlerHolder )
            let previoudControler=  controlerBodies[previousControlerHolder]
            console.log(previoudControler)
            previoudControler.body.setCollisionFlags(0)
            previoudControler.body.setActivationState(1);
        }

        if(bodySlot=== locationArrayFloat32[0]){
            
            transform.setOrigin(tempPoition.fromArray(locationArrayFloat32,1))
            transform.setRotation(tempQuat.fromArray(locationArrayFloat32,4))
            body.body.getMotionState().setWorldTransform( transform );
            sharedInfoArrayFloat32.set(locationArrayFloat32.slice(1,9),bodySlot+1)
            previousControlerHolder = locationArrayFloat32[0]
            // console.log(body.body.getLinearVelocity().length())
            // if(body.body.getLinearVelocity().length() > 0){
            // console.log(body.body.getLinearVelocity().length())

            //     tempVelocity.fromArray(locationArrayFloat32,1)
            //     body.body.setLinearVelocity(tempVelocity)
            //     body.body.getMotionState().getWorldTransform(transformAux1);
            //     transformAux1.toUpdate(sharedInfoArrayFloat32, bodySlot);
            // }
          
        
        }else{
            sharedInfoArrayFloat32[bodySlot] = body.body.getLinearVelocity().length();
            body.body.getMotionState().getWorldTransform(transformAux1);
            transformAux1.toUpdate(sharedInfoArrayFloat32, bodySlot);
        }
    }
}

function stepRigidBody(array, offset) {
    for (var x in rigidBodies) {
        const body = rigidBodies[x];
        const bodySlot = body.id;
        sharedInfoArrayFloat32[bodySlot] = body.body.getLinearVelocity().length();
        body.body.getMotionState().getWorldTransform(transformAux1);
        //Checking out of bounce objects and dynamically freeing memory.
        const Y = transformAux1.toYCheck(-100)
        if (Y) {
            MeshSwitch(body, AmmoFree, true)
        } else {
            transformAux1.toUpdate(sharedInfoArrayFloat32, bodySlot);
        }
    }

    // rigidBodies.forEach((body) => {
    //     const bodySlot = body.id;
    //     sharedInfoArrayFloat32[bodySlot] = body.body.getLinearVelocity().length();
    //     body.body.getMotionState().getWorldTransform(transformAux1);
    //     transformAux1.toUpdate(sharedInfoArrayFloat32, bodySlot);
    // })
}

//Memory freeing function depending on which assoicated 
function MeshSwitch(data, func, fromPhy) {
    const o = data.o || data;
    switch (o.MeshType) {
        case "Rigid":
            func(rigidBodies, o, fromPhy);
            break;
        case "Controler":
            func(controlerBodies, o, fromPhy);
            break;
    }
}

//Memory Freeing function.
function AmmoFree(list, o, fromPhy) {
    const body = list[o.id];
    const bodySlot = o.id;
    const slotNum = body.slotNum;

    const freeArray = new Float32Array(slotNum);
    sharedInfoArrayFloat32.set(freeArray, bodySlot);


    Ammo.destroy(body.body.getCollisionShape())
    physicsWorld.removeRigidBody(body.body);
    Ammo.destroy(body.body);

    // bookKeeping[pointer[1]] = bodySlot;
    // bookKeeping[pointer[1]+1] = slotNum;
    // pointer[1] += 2;

    //Added to book keeping
    MemoryFree[o.id] = slotNum;

    //fromPhy is the boolean the representing the orgin of the free process true: from the phyics engine.
    if (fromPhy) {
        var o = { id: o.id, MeshType: body.MeshType, slotNum: slotNum }
        //Confirming the delete of phyics body is done, and delete the associated rendering object by posting.
        self.postMessage({ m: "delete", o: o })
    }
    delete list[o.id];
}

function ammoMathPrototype() {

    Ammo.btVector3.prototype.fromArray = function (array, offset) {
        offset = offset || 0;

        this.setValue(array[offset], array[offset + 1], array[offset + 2]);
        return this;
    };
    Ammo.btVector3.prototype.toArray = function (array, offset) {
        offset = offset || 0;
        array[offset] = this.x();
        array[offset + 1] = this.y();
        array[offset + 2] = this.z();
    };
    Ammo.btVector3.prototype.zero = function () {
        this.setValue(0, 0, 0);
        return this;
    };

    Ammo.btQuaternion.prototype.fromArray = function (array, offset) {
        offset = offset || 0;
        this.setValue(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);

    };
    Ammo.btQuaternion.prototype.toArray = function (array, offset) {

        offset = offset || 0;

        array[offset] = this.x() || 0;
        array[offset + 1] = this.y() || 0;
        array[offset + 2] = this.z() || 0;
        array[offset + 3] = this.w() || 0;

    };

    Ammo.btTransform.prototype.toYCheck = function (bound) {
        const origin = this.getOrigin();
        return bound > origin.y();
    };

    Ammo.btTransform.prototype.toUpdate = function (array, bodySlot) {
        bodySlot = bodySlot || 0;
        const origin = this.getOrigin();
        const rotation = this.getRotation();

        array[bodySlot + 1] = origin.x();
        array[bodySlot + 2] = origin.y();
        array[bodySlot + 3] = origin.z();

        array[bodySlot + 4] = rotation.x();
        array[bodySlot + 5] = rotation.y();
        array[bodySlot + 6] = rotation.z();
        array[bodySlot + 7] = rotation.w();

    };

    Ammo.btTransform.prototype.toArray = function (array, offset) {
        offset = offset || 0;

        this.getOrigin().toArray(array, offset);
        this.getRotation().toArray(array, offset + 3);
    };
}

