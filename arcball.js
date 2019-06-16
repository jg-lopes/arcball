var containers;
var camera, scene, raycaster, renderer;
var mouse = new THREE.Vector2();
var isClicking;
var frustumSize = 2;

var mouseVector = new THREE.Vector3();
var quaternion = new THREE.Quaternion();
var curIntersection = new THREE.Vector2();
var lastIntersection = new THREE.Vector2();

var interactiveBoxes;

var currentClicked;
var activeArcball;

var mode = "ROTATE";



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
    interactiveBoxes = new THREE.Group();

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

    box.scale.set(0.5, 0.5, 0.5);
    box.translateX(-0.5);
    box.translateY(-0.5);
    box.translateZ(-10);

    box.rotateX(Math.PI/5);
    box.rotateY(Math.PI/5);

    interactiveBoxes.add( box );

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
    var box2 = new THREE.Mesh( geometry, material );

    box2.scale.set(0.75, 0.75, 0.75);
    box2.translateX(0.3);
    box2.translateY(-0.2);
    box2.translateZ(-5);


    box2.rotateY(Math.PI/5);
    box2.rotateZ(Math.PI/5);

    interactiveBoxes.add( box2 );

    scene.add( interactiveBoxes );

    // // Sphere
    // var sphereGeom = new THREE.SphereGeometry(1, 100, 100);
    // var blueMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.3 } );
    // var sphere = new THREE.Mesh( sphereGeom, blueMaterial );
    // interactiveBox.add(sphere);
    
    // scene.add(interactiveBox);




    document.addEventListener( 'mousedown', onDocumentMouseDown, false);
    document.addEventListener( 'mouseup', onDocumentMouseUp, false);
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousewheel', onDocumentMouseWheel, false);
    document.addEventListener( 'dblclick', onDocumentDoubleClick, false);



    document.body.appendChild( renderer.domElement );
}

function experimentalBall(uv) {
    P = new THREE.Vector3;

    P.set(
        uv.x,
        uv.y,
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

    
    //console.log(pos);
    console.log(vec);
}

function onDocumentDoubleClick(event) {;
    scene.remove(scene.getObjectByName('arcball'));
    raycaster.setFromCamera(mouseVector, camera);

    var intersects = raycaster.intersectObjects(scene.children, true);
    if (! isEmpty(intersects)) {

        currentClicked = intersects[0].object;
        

        var sphereGeom = new THREE.SphereGeometry(1, 100, 100);
        var blueMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.3 } );
        activeArcball = new THREE.Mesh( sphereGeom, blueMaterial );
        
        activeArcball.name = 'arcball';
        objScale = intersects[0].object.scale;
        objPosition = intersects[0].object.position;
        activeArcball.scale.set(objScale.x, objScale.y, objScale.z);
        activeArcball.position.set(objPosition.x, objPosition.y, objPosition.z);

        scene.add(activeArcball);
        
    } else {
        currentClicked = interactiveBoxes;

        var sphereGeom = new THREE.SphereGeometry(1, 100, 100);
        var blueMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.3 } );
        activeArcball = new THREE.Mesh( sphereGeom, blueMaterial );
        
        activeArcball.name = 'arcball';
        
        var boxList = interactiveBoxes.children;

        var positionArcball = new THREE.Vector2(0, 0);
        
        // Finds the centroid of all the existing cubes
        for (i = 0; i < boxList.length; i++) {
            positionArcball.x += boxList[i].position.x;
            positionArcball.y += boxList[i].position.y;
        }

        positionArcball.divideScalar(boxList.length);



        var maxDist = 0;
        var maxBox, distance;
        // Finds the distance to the furthest cube from centroid
        for (i = 0; i < boxList.length; i++) {
            
            px = boxList[i].position.x - positionArcball.x;
            py = boxList[i].position.y - positionArcball.y;

            distance = px * px + py * py;

            if (distance > maxDist) { 
                maxDist = distance;
            }
        }

        // Square roots it to find correct maxDist
        // Multiplies by 3 since the distances are calculated to the centroid of the boxes
        // Needs to fill the entire box + some extra space 
        maxDist = Math.sqrt(maxDist) * 3;


        activeArcball.position.set(positionArcball.x, positionArcball.y, -3);
        activeArcball.scale.set(maxDist, maxDist, maxDist);
        scene.add(activeArcball);

    }
}

function onDocumentMouseUp(event) {
    isClicking = false;
}

var lastInputInside = 1;
var mouseUnproj = new THREE.Vector3();
var centerUnproj = new THREE.Vector3();
function onDocumentMouseMove( event ) {

    mouseVector.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouseVector.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
    raycaster.setFromCamera(mouseVector, camera);

    if (activeArcball != undefined) {
        var intersects = raycaster.intersectObject(activeArcball);
    }

    if (! isEmpty(intersects)){  
        curIntersection.x = intersects[0].point.x
        curIntersection.y = intersects[0].point.y;

        if (isClicking) {
            va = experimentalBall(lastIntersection);
            vb = experimentalBall(curIntersection);

            var angle = Math.acos(Math.min(1, va.dot(vb) / va.length() / vb.length()));
            var axis = va.cross(vb).normalize();
            
            // Removes extreme rotations (due to unset last vectors or change between inside/outside, not user input)
            if (lastInputInside == 1) {
                quaternion.setFromAxisAngle(axis, angle);
                if (currentClicked != interactiveBoxes) {
                    currentClicked.quaternion.multiplyQuaternions(quaternion, currentClicked.quaternion);
                } else {
                    var boxList = interactiveBoxes.children;
                    for (i = 0; i < boxList.length; i++) {
                        boxList[i].quaternion.multiplyQuaternions(quaternion, boxList[i].quaternion);
                    }
                }
            }
            var string = "IN";
            console.log({string, axis, angle});
        }

        lastIntersection.x = curIntersection.x;
        lastIntersection.y = curIntersection.y;

        lastInputInside = 1;

    } else {
        mouseUnproj.set(
            ( event.clientX / window.innerWidth ) * 2 - 1,
            - ( event.clientY / window.innerHeight ) * 2 + 1,
            0 );
        
        mouseUnproj.unproject( camera );
    
        var centerUnproj = currentClicked.position.clone();
        centerUnproj.unproject (camera);
        
        mouseUnproj.z = 0;
        centerUnproj.z = 0;
        mouseUnproj.sub(centerUnproj).normalize();

        curIntersection.x = mouseUnproj.x
        curIntersection.y = mouseUnproj.y;

        if (isClicking) {
            va = experimentalBall(lastIntersection);
            vb = experimentalBall(curIntersection);

            var angle = Math.acos(Math.min(1, va.dot(vb) / va.length() / vb.length()));
            var axis = va.cross(vb).normalize();
            
            // Removes extreme rotations (due to unset last vectors or change between inside/outside, not user input)
            if (lastInputInside == 0) {
                quaternion.setFromAxisAngle(axis, angle);
                if (currentClicked != interactiveBoxes) {
                    currentClicked.quaternion.multiplyQuaternions(quaternion, currentClicked.quaternion);
                }else {
                    var boxList = interactiveBoxes.children;
                    for (i = 0; i < boxList.length; i++) {
                        boxList[i].quaternion.multiplyQuaternions(quaternion, boxList[i].quaternion);
                    }
                }
            }
            var string = "OUT";
            console.log({string, axis, angle});
        }

        lastIntersection.x = curIntersection.x;
        lastIntersection.y = curIntersection.y;

        lastInputInside = 0;
    }
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

function onDocumentMouseWheel(event) {


    if (event.deltaY < 0) { 
        if (camera.zoom > 0.2)
            camera.zoom -= 0.1;
    };
    
    if (event.deltaY > 0) { 
        camera.zoom += 0.1 
    };
    camera.updateProjectionMatrix();

}

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}