class Controler{
    
    constructor(locationArrayFloat32, mouse, raycast, camera ,rigidBodies, scene ){
        this.position = locationArrayFloat32;
        this.mouse = mouse;
        this.raycast = raycast;
        this.camera = camera;
        this.rigidBodies = rigidBodies;
        this.scene = scene;
        this.MeshCollection ={};
    }

    setMesh(name, geometry, material){
        
        this.Mesh = new ThreeFree.Mesh(geometry,material)
        this.MeshCollection[name] = this.Mesh;
        this.scene.add(this.Mesh)
    }

    getMeshCollection(){
        return this.MeshCollection;
    }

    tracking(){
        this.raycaster.setFromCamera(this.mouse, this.camera);
        var intersections = this.raycaster.intersections(this.rigidBodies);
    }
}