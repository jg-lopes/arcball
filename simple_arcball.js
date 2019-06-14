var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
//var camera = new THREE.OrthographicCamera();
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry = new THREE.BoxGeometry( 1, 1, 1 );

// Colors of the face of the cube (following a Rubik's Cube model)
// Blue - FRONT // Green - BACK
// Yellow - UP // White - DOWN
// Red - RIGHT // Orange - LEFT
var colors = [ 'red', 'orange', 'yellow', 'white', 'blue', 'green'];

for ( var i = 0; i < geometry.faces.length; i += 2 ) {
    var color = new THREE.Color( colors[i/2] );
    geometry.faces[ i ].color.set(color);
    geometry.faces[ i + 1 ].color.set( color);
}

var material = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 3;

// ARCBALL INTERACTION

var mouse = new THREE.Vector2();
var last = new THREE.Vector2();
var cur = new THREE.Vector2();
var arcball_on = false;


var angle;
var axis = new THREE.Vector3();
var quaternion = new THREE.Quaternion();

var prevQuaternion = new THREE.Quaternion(); 

document.addEventListener('mousedown', onDocumentMouseDown);
document.addEventListener('mousemove', onDocumentMouseMove);
document.addEventListener('mouseup', onDocumentMouseUp);

animate();


function toRadians(angle) {
	return angle * (Math.PI / 180);
}


function getArcballVector(vector2) {
    P = new THREE.Vector3();
    
    P.set(
        ( vector2.x / window.innerWidth ) * 2 - 1,
        - ( vector2.y / window.innerHeight ) * 2 + 1,
        0 ); 
    
    

    OP_length = P.length();

    if (OP_length <= 1 ){
        P.z = Math.sqrt(1 - OP_length * OP_length);
    } else {
        P = P.normalize();
    }

    return P;
}


function onDocumentMouseDown(event) {
    
    arcball_on = true;  
}

function onDocumentMouseUp(event) {
    arcball_on = false;

    prevQuaternion = quaternion;
}

function onDocumentMouseMove(event) {

    cur.x = event.clientX;
    cur.y = event.clientY;
    
    if (arcball_on) {
       

        va = getArcballVector(last);
        vb = getArcballVector(cur);

        var angle = Math.acos(Math.min(1, va.dot(vb) / va.length() /vb.length()));
        var axis = va.cross(vb).normalize();

        console.log(angle);
        quaternion.setFromAxisAngle(axis, angle);
        cube.quaternion.multiplyQuaternions(quaternion, cube.quaternion);

        
    }


    last.x = cur.x;
    last.y = cur.y;


}


function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
};
