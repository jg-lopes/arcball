var scene = new THREE.Scene();
var screenSize = Math.min(window.innerWidth, window.innerHeight);
//var camera = new THREE.OrthographicCamera( window.innerWidth / - screenSize, window.innerWidth / screenSize, window.innerHeight / screenSize, window.innerHeight / -screenSize, - 500, 1000); 
var camera = new THREE.OrthographicCamera( -1, 1, 1, -1, - 500, 1000); 
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

var color = new THREE.Color( 'lightblue' );
renderer.setClearColor( color );

var material = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

var sphereGeom =  new THREE.SphereGeometry(1, 100, 100);
var blueMaterial = new THREE.MeshBasicMaterial( { color: 0xee00ee, transparent: true, opacity: 0.3 } );
var sphere = new THREE.Mesh( sphereGeom, blueMaterial );
scene.add(sphere);

var offset = new THREE.Vector3(0.25, 0.25, 0);

scene.translateX(0.25);
scene.translateY(0.25);
scene.translateZ(0.25);



// ARCBALL INTERACTION

var mouse = new THREE.Vector2();
var last = new THREE.Vector2();
var cur = new THREE.Vector2();
var arcball_on = false;


var angle;
var axis = new THREE.Vector3();
var quaternion = new THREE.Quaternion();

document.addEventListener('mousedown', onDocumentMouseDown);
document.addEventListener('mousemove', onDocumentMouseMove);
document.addEventListener('mouseup', onDocumentMouseUp);


animate();


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

var raycaster = new THREE.Raycaster();

function experimentalBall(vector2, offset) {
    P = new THREE.Vector3();

    windowCoordX = ( vector2.x / window.innerWidth ) * 2 - 1
    windowCoordY = - ( vector2.y / window.innerHeight ) * 2 + 1

    P.set(
        windowCoordX - offset.x,
        windowCoordY - offset.y,
        0 ); 
    
    raycaster.setFromCamera({windowCoordX, windowCoordY}, camera);
    
    // var intersects = raycaster.intersectObject(sphere); //array
    // //intersects.object.material.color.set(0xff0000);

    // console.log((vector2.x / 1000) - 0.5 * (window.innerWidth / 1000) );

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
}

function onDocumentMouseMove(event) {

    cur.x = event.clientX;
    cur.y = event.clientY;
    
    if (arcball_on) {
       

        va = experimentalBall(last, offset);
        vb = experimentalBall(cur, offset);

        var angle = Math.acos(Math.min(1, va.dot(vb) / va.length() /vb.length()));
        var axis = va.cross(vb).normalize();

        quaternion.setFromAxisAngle(axis, angle);
        cube.quaternion.multiplyQuaternions(quaternion, cube.quaternion);

        
    }


    last.x = cur.x;
    last.y = cur.y;


}

function onWindowResize()
	{
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}


function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
};
