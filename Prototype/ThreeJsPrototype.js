THREE.Vector3.prototype.fromArray = function (array, offset) {
    if(array=== undefined){
        return this;
    }
    offset = offset || 0;
    this.set(array[offset], array[offset + 1], array[offset + 2]);
    return this;
};

THREE.Vector3.prototype.toArray = function (array, offset) {
    offset = offset || 0;
    array[offset] = this.x;
    array[offset + 1] = this.y;
    array[offset + 2] = this.z;
    // console.log(array)
};



// THREE.Vector3.prototype.add = function (vec3) {
//     this.x += vec3.x;
//     this.y += vec3.y;
//     this.z += vec3.z;
//     console.log(this)
//     return this
// };


THREE.Euler.prototype.fromDegree = function (array) {
    if(array=== undefined){
        return this;
    }
    this.set((array[0] * Math.PI)/180, (array[1]* Math.PI)/180,(array[2]* Math.PI)/180);
};

THREE.Euler.prototype.toArray = function (array,offset) {
    offset = offset || 0;
     console.log(this._x())
    array[0] = this._x;
    array[1] = this._y;
    array[2] = this._z;
    // return array
    console.log(array)
};

THREE.Quaternion.prototype.fromArray= function (array, offset) {
    offset = offset || 0;
    this.set(array[offset], array[offset + 1], array[offset + 2], array[offset +3]);
    return this;
};

THREE.Quaternion.prototype.toArray= function (array, offset) {
    offset = offset || 0; 
    array[0] = this.x;
    array[1] = this.y;
    array[2] = this.z;
    array[3] = this.w;
    return this;
};