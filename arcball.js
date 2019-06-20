var camera, scene, raycaster, renderer;
var frustumSize = 40;
var isClicking;

// Stores the mouse vector in normalized device coordinates
var mouseVector = new THREE.Vector3();
// Stores the mouse vector in the event position
var mouseEvent = new THREE.Vector3();
// Stores the quaternion which is used in the rotations
var quaternion = new THREE.Quaternion();
// Stores the currrent and last intersections of the mouse with the arcball in order to calculate the rotation
var curIntersection = new THREE.Vector2();
var lastIntersection = new THREE.Vector2();

// Father group that contains all boxes on screen
var interactiveBoxes;

// Stores the currently double clicked object
var currentDoubleClicked;

// Stores the currently active arcball (if available)
var activeArcball;

// Stores information on which object was last clicked
var currentClicked; 

// Dictionary which stores the information 
var mode = {};

init();
animate();

function createCube() {

    var geometry = new THREE.BoxGeometry(1, 1, 1);

    // Colors of the face of the cube (following a Rubik's Cube model)
    // Blue - FRONT // Green - BACK // Yellow - UP // gray - DOWN // Red - RIGHT // Orange - LEFT
    var colors = [ 'red', 'orange', 'yellow', 'gray', 'blue', 'green'];
    for ( var i = 0; i < geometry.faces.length; i += 2 ) {
        var color = new THREE.Color( colors[i/2] );
        geometry.faces[ i ].color.set(color);
        geometry.faces[ i + 1 ].color.set( color);
    }
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );

    var box = new THREE.Mesh( geometry, material );

    box.position.x = Math.random() * 30 - 15;
    box.position.y = Math.random() * 30 - 15;
    box.position.z = Math.random() * 30 - 15;

    box.rotation.x = Math.random() * 2 * Math.PI;
    box.rotation.y = Math.random() * 2 * Math.PI;
    box.rotation.z = Math.random() * 2 * Math.PI;

    box.scale.x = Math.random() * 5 + 1;
    box.scale.y = Math.random() * 5 + 1;
    box.scale.z = Math.random() * 5 + 1;
    
    mode[box.id] = "TRANSLATE";

    interactiveBoxes.add( box );
}


function init() {
    // Intialization function

    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 );
    // Translates far on Z axis so that it can see the group arcball correctly even for a separeted group
    camera.translateZ(500); 

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );

    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );


    // Introducing the cube + arcball visualization object
    interactiveBoxes = new THREE.Group();

    for (var i = 0; i < 10; i++) {
        createCube();
    }

    scene.add( interactiveBoxes );

    document.addEventListener( 'mousedown', onDocumentMouseDown, false);
    document.addEventListener( 'mouseup', onDocumentMouseUp, false);
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'wheel', onDocumentMouseWheel, false);
    document.addEventListener( 'dblclick', onDocumentDoubleClick, false);

    document.body.appendChild( renderer.domElement );
}

// Declares the start of a click
function onDocumentMouseDown(event) {
    // Sets the isClicking variable and checks for the translation

    isClicking = true;

    raycaster.setFromCamera(mouseVector, camera);
    var intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        currentClicked = intersects[0].object;

    }
}

// Declares the ending of a click
function onDocumentMouseUp(event) {
    // Unsets the variables defined on mousedown
    isClicking = false;
    currentClicked = undefined;

    // Resets intersections (prevents anomalous behaviour on the arcball after reclick)
    curIntersection = new THREE.Vector2();
    lastIntersection = new THREE.Vector2();
}

// #############################################################################################
// Double click functions
// #############################################################################################


function onDocumentDoubleClick(event) {
    // Removes previously placed arcball
    // This both allows the mouse to click objects "behind the arcball"
        // and as well allows for seamlessly changing active arcballs
    scene.remove(scene.getObjectByName('arcball'));
    
    // Undefines translation from the first click (the user intended to do a doubleclick)
    currentClicked = undefined;

    // Raycaster to discover intersections
    raycaster.setFromCamera(mouseVector, camera);
    var intersects = raycaster.intersectObjects(scene.children, true);

    // If doubeclicked a box
    if (intersects.length > 0) {
        currentDoubleClicked = intersects[0].object;
        
        // Changes the box's mode
        if (mode[currentDoubleClicked.id] == "ROTATE") {
            mode[currentDoubleClicked.id] = "TRANSLATE";
        } else {
            mode[currentDoubleClicked.id] = "ROTATE";
        }

        // If mode is rotate, creates an arcball
        if (mode[currentDoubleClicked.id] == "ROTATE") {
            var objPosition = new THREE.Vector3();

            objScale = intersects[0].object.scale;
            // Finds the position of the center of the object in the world coordinates
            scene.updateMatrixWorld();
            objPosition.setFromMatrixPosition (intersects[0].object.matrixWorld);

            createArcball(objScale, objPosition);
        }
    // If the doubleclick was in open space
    } else {
        // Selects the group -> needs to create group arcball
        currentDoubleClicked = interactiveBoxes;

        var boxList = interactiveBoxes.children;

        // Resets all to rotate
        for (i = 0; i < boxList.length; i++ ){
            mode[boxList[i].id] = "ROTATE";
        }
        mode[interactiveBoxes.id] = "ROTATE";
        
        var positionArcball = new THREE.Vector3(0, 0, 0);
        
        // Finds the centroid of all the existing cubes
        for (i = 0; i < boxList.length; i++) {
            positionArcball.x += boxList[i].position.x;
            positionArcball.y += boxList[i].position.y;
            positionArcball.z += boxList[i].position.z;
        }

        positionArcball.divideScalar(boxList.length);



        var maxDist = 0;
        var distance;
        // Finds the distance to the furthest cube from centroid
        for (i = 0; i < boxList.length; i++) {
            
            var px = boxList[i].position.x - positionArcball.x;
            var py = boxList[i].position.y - positionArcball.y;
            var pz = boxList[i].position.z - positionArcball.z;

            distance = Math.sqrt(px * px + py * py + pz * pz);

            if (distance > maxDist) { 
                maxDist = distance;
            }
        }

        // Square roots it to find correct maxDist
        // Multiplies by 1.5 since the distances are calculated to the centroid of the boxes
        // Needs to fill the entire box + some extra space 
        maxDist *= 1.5;
        var maxDistVector = new THREE.Vector3(maxDist,maxDist,maxDist);

        // Creates the group arcball
        createArcball(maxDistVector, positionArcball );
    }
}

// Creates the arcball object with a specific position and scale
function createArcball(scaleVector, positionVector) {
    var sphereGeom = new THREE.SphereGeometry(1, 100, 100);
    var blueMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.3 } );
    activeArcball = new THREE.Mesh( sphereGeom, blueMaterial );

    activeArcball.name = 'arcball';

    var maxScale = Math.max(scaleVector.x, scaleVector.y, scaleVector.z);

    activeArcball.scale.set(maxScale, maxScale, maxScale);
    activeArcball.translateX(positionVector.x);
    activeArcball.translateY(positionVector.y);
    activeArcball.translateZ(positionVector.z);

    scene.add(activeArcball);
}


// #############################################################################################
// Mouse movement functions
// #############################################################################################

// Organizes behaviour generated by a mouse movement
// Defines if the last input of the mouse was made inside or outside the arcball
var lastInputInside = 1;
function onDocumentMouseMove( event ) {

    // Refreshes the data in the mouseEvent and mouseVector vectors
    mouseEvent.x = event.clientX;
    mouseEvent.y = event.clientY;
    // Transforms the mouse position in normalized device coordinates
    mouseVector.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouseVector.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
    raycaster.setFromCamera(mouseVector, camera);

    // If the click was in an arcball or an object with rotate mode
    if (currentClicked == activeArcball || mode[interactiveBoxes.id] == "ROTATE") {
        // And the corresponding object exists and is in rotate mode
        if ( currentDoubleClicked != undefined && mode[currentDoubleClicked.id] == "ROTATE" ) {
            var intersects = raycaster.intersectObject(activeArcball);

            // If it intersects the arcball (mouseVector inside of arcball)
            if (intersects.length > 0){
                // Operates such that it can work in multiple box positions
                var temp = intersects[0].point.clone();
                var objPosition = new THREE.Vector3();
                scene.updateMatrixWorld();
                objPosition.setFromMatrixPosition (intersects[0].object.matrixWorld);
                temp.sub(objPosition).normalize();

                arcballManipulation (temp, lastInputInside, 1);
                lastInputInside = 1;
            } else {
                arcballManipulation (getCenterToMouseVector(), lastInputInside, 0);
                lastInputInside = 0;
            }
        }
    }

}

// Given a vector clicked outside the arcball, calculates the normalized vector for introducing rotations
function arcballVector(vector) {
    P = new THREE.Vector3;

    P.set( vector.x,vector.y, 0 ); 

    OP_length = P.length();

    if (OP_length <= 1 ){
        P.z = Math.sqrt(1 - OP_length * OP_length);
    } else {
        P = P.normalize();
    }

    return P;
}

// Receives an vector to serve as a manipulator of the arcball, and does the required calculations
function arcballManipulation (inputVector, lastInputInsideValue, desiredInputInside) {
    curIntersection.x = inputVector.x
    curIntersection.y = inputVector.y;

    if (isClicking) {
        va = arcballVector(lastIntersection);
        vb = arcballVector(curIntersection);

        var angle = Math.acos(Math.min(1, va.dot(vb) / va.length() / vb.length()));
        var axis = va.cross(vb).normalize();
        
        // Removes extreme rotations (due to unset last vectors or change between inside/outside, not user input)
        if (lastInputInsideValue == desiredInputInside) {
            executeRotation(axis, angle);
        }
    }

    lastIntersection.x = curIntersection.x;
    lastIntersection.y = curIntersection.y;
}

// Gets a vector pointing from the center of a arcball to the mouse position
function getCenterToMouseVector() {
    var mouse;
    var center = new THREE.Vector3();
    mouse = mouseVector.clone();

    scene.updateMatrixWorld();
    center.setFromMatrixPosition (activeArcball.matrixWorld);
    center.unproject(camera).normalize(); 

    mouse.z = 0;
    center.z = 0;
 


    mouse.sub(center).normalize();
    return mouse;
}

// Executes the rotation defined by axis angle in the clicked object
function executeRotation(axis, angle) {
    if (currentDoubleClicked != interactiveBoxes) {
        // Applies the conjugate of the rotation of the group
        // Guarantees the principle of "What you see is what you get" in the manipulation of the box
        var temp = interactiveBoxes.quaternion.clone();
        axis.applyQuaternion(temp.conjugate());
        
        quaternion.setFromAxisAngle(axis, angle);
        currentDoubleClicked.quaternion.multiplyQuaternions(quaternion, currentDoubleClicked.quaternion);
    } else {
        quaternion.setFromAxisAngle(axis, angle);
        interactiveBoxes.quaternion.multiplyQuaternions(quaternion, interactiveBoxes.quaternion);
    }
}

// #############################################################################################


// Manipulates the camera so resizing has a consistent behaviour
function onWindowResize() {
    

    var aspect = window.innerWidth / window.innerHeight;
    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

// Mouse wheel regulates the zoom of the camera
function onDocumentMouseWheel(event) {
    

    if (event.deltaY < 0) { 
        camera.zoom *= 1.25;
    };
    
    if (event.deltaY > 0) { 
        if (camera.zoom > 0.1)
            camera.zoom /= 1.25;
    };
    camera.updateProjectionMatrix();

}

function animate() {
    requestAnimationFrame( animate );
    //scene.updateMatrixWorld();

    raycaster.setFromCamera(mouseVector, camera);
    var intersect = raycaster.intersectObjects(interactiveBoxes.children);
    
    // Handles the intersection event
    // If conditions are created to preserve interesting translation properties such as:
    // 1. If a box is being translated, even when the mouse hovers another box it still keeps translating ONLY the first
    // 2. If the mouse "escapes" the intersection of the box, the translation still continues
    // 3. The behaviour is consistent even when another cube is in rotation
    if ( intersect.length > 0 && isClicking && currentClicked == intersect[0].object && currentClicked != activeArcball && mode[intersect[0].object.id] == "TRANSLATE") {
    
        mouseEvent = mouseVector.clone();
        mouseEvent.unproject(camera);

        var temp = interactiveBoxes.quaternion.clone();
        mouseEvent.applyQuaternion(temp.conjugate())

        intersect[0].object.position.setX(mouseEvent.x);
        intersect[0].object.position.setY(mouseEvent.y);
        intersect[0].object.position.setZ(mouseEvent.z);
        

        currentClicked = intersect[0].object;

    } else if (intersect.length == 0 && currentClicked != undefined && currentClicked != activeArcball && mode[currentClicked.id] == "TRANSLATE") {
        
        mouseEvent = mouseVector.clone();
        mouseEvent.unproject(camera);

        var temp = interactiveBoxes.quaternion.clone();
        mouseEvent.applyQuaternion(temp.conjugate())

        currentClicked.position.setX(mouseEvent.x);
        currentClicked.position.setY(mouseEvent.y);
        currentClicked.position.setZ(mouseEvent.z);
    }
    renderer.render( scene, camera );
}
