var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
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

document.addEventListener('mousedown', onDocumentMouseDown);
document.addEventListener('mousemove', onDocumentMouseMove);
document.addEventListener('mouseup', onDocumentMouseUp);

function onDocumentMouseDown(event) {
    
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
    arcball_on = true;
    last.x = cur.x = mouse.x;
    last.y = cur.y = mouse.y;   
}

function onDocumentMouseUp(event) {
    arcball_on = false;
}

function onDocumentMouseMove(event) {

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    if (arcball_on) {
        cur.x = mouse.x;
        cur.y = mouse.y;
    }

}

// void onMouse(int button, int state, int x, int y) {
//     if (button == GLUT_LEFT_BUTTON && state == GLUT_DOWN) {
//       arcball_on = true;
//       last_mx = cur_mx = x;
//       last_my = cur_my = y;
//     } else {
//       arcball_on = false;
//     }
//   }

var animate = function () {
    requestAnimationFrame( animate );

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render( scene, camera );
};

animate();