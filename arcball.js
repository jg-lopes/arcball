var containers;
var camera, scene, raycaster, renderer;
var mouse = new THREE.Vector2();
var isClicking;
var frustumSize = 2;


var lastMouse = new THREE.Vector2();
var curMouse = new THREE.Vector2();
var quaternion = new THREE.Quaternion();

var interactiveBox;

init();
animate();



function init() {

    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 );
    //camera = new THREE.OrthographicCamera( -1, 1, 1, -1, - 500, 500); 
    camera.translateZ(500); 

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );

    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );


    // Introducing the cube + arcball visualization object
    interactiveBox = new THREE.Object3D();

    // Cube
    var geometry = new THREE.BoxGeometry( 1, 1, 1);
    // Colors of the face of the cube (following a Rubik's Cube model)
    // Blue - FRONT // Green - BACK // Yellow - UP // White - DOWN // Red - RIGHT // Orange - LEFT
    var colors = [ 'red', 'orange', 'yellow', 'white', 'blue', 'green'];
    for ( var i = 0; i < geometry.faces.length; i += 2 ) {
        var color = new THREE.Color( colors[i/2] );
        geometry.faces[ i ].color.set(color);
        geometry.faces[ i + 1 ].color.set( color);
    }
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );
    var box = new THREE.Mesh( geometry, material );
    interactiveBox.add( box );

    // Sphere
    var sphereGeom = new THREE.SphereGeometry(1, 100, 100);
    var blueMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.3 } );
    var sphere = new THREE.Mesh( sphereGeom, blueMaterial );
    interactiveBox.add(sphere);
    
    scene.add(interactiveBox);


    interactiveBox.scale.set(0.5, 0.5, 0.5);
    interactiveBox.translateX(-0.5);
    interactiveBox.translateY(-0.5);
    interactiveBox.translateZ(-10);




    document.addEventListener( 'mousedown', onDocumentMouseDown, false);
    document.addEventListener( 'mouseup', onDocumentMouseUp, false);
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    window.addEventListener( 'resize', onWindowResize, false );

    document.body.appendChild( renderer.domElement );
}


function getArcballVector(mouseEvent, object) {
    P = new THREE.Vector3();
    windowCoord = new THREE.Vector2();

    offset = object.position;
    scale = object.scale;

    // Adjusting the mouse coordinates to the window coordinates
    // Respecting the aspect size of the screen
    windowMinSize = Math.min(window.innerWidth, window.innerHeight);

    windowCoord.x = - window.innerWidth / 2;
    windowCoord.y = - window.innerHeight / 2; 

    windowCoord.x += mouseEvent.x;
    windowCoord.y += mouseEvent.y;

    windowCoord.x = (windowCoord.x * 2 / windowMinSize);
    windowCoord.y = - (windowCoord.y * 2 / windowMinSize);
    
    P.set(
        (windowCoord.x - offset.x) / scale.x,
        (windowCoord.y - offset.y) / scale.y,
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
    isClicking = true;
    
    //console.log(experimentalBall(mouseEvent, offset, scale));
}

function onDocumentMouseUp(event) {
    isClicking = false;
}


function onDocumentMouseMove( event ) {

    curMouse.x = event.clientX;
    curMouse.y = event.clientY;
    
    if (isClicking) {
       

        va = getArcballVector(lastMouse, interactiveBox);
        vb = getArcballVector(curMouse, interactiveBox);

        var angle = Math.acos(Math.min(1, va.dot(vb) / va.length() /vb.length()));
        var axis = va.cross(vb).normalize();

        quaternion.setFromAxisAngle(axis, angle);
        interactiveBox.quaternion.multiplyQuaternions(quaternion, interactiveBox.quaternion);

        
    }


    lastMouse.x = curMouse.x;
    lastMouse.y = curMouse.y;
}


function onWindowResize() {

    var aspect = window.innerWidth / window.innerHeight;
    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}


function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

