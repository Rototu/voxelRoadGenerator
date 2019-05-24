const MapGen = (function () {

  "use strict";

  /*
   Conventions:
      x: left to right;
      y: downwards;
      z: depth;
      x,y,z are always positive;
      Horizontal roads are at bottom of voxels;
      Orientation: 1 = forward, 2 = forward-right, 3 = right, ..., 8 = forward-left;
      Orientation is relative to build direction;
      Climb: 1 = upwards, 0 = horizontal, -1 = downwards;
*/

  // clone obj as class instance
  function cloneObj(obj) {
    return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
  }

  // 3D position container with methods
  class Pos3D {

    // expects positive numbers
    constructor(x, y, z) {
      if (isNaN(x) || isNaN(y) || isNaN(z) || x < 0 || y < 0 || z < 0) {
        console.log(x, y, z);
        throw new Error("Wrong arguments for position");
      }

      this.x = x;
      this.y = y;
      this.z = z;
    }

    // decrement x, y or z value by one
    decrease(coord) {
      if (["x", "y", "z"].includes(coord)) {
        this[coord] -= 1;
        return this;
      } else {
        throw new Error("Expected x, y, or z chars");
      }
    }

    // increment x, y or z value by one
    increase(coord) {
      if (["x", "y", "z"].includes(coord)) {
        this[coord] += 1;
        return this;
      } else {
        throw new Error("Expected x, y, or z chars");
      }
    }

  }

  // Array of voxel divisions of a cube
  class Arr3D {

    // size = number of divisions per side
    constructor(size) {

      if (isNaN(size) || size < 0 || Math.floor(size) !== size)
        throw new Error("3D Array size must be a positive integer");

      this.content = [];
      this.size = size;

      // populate voxels with null values
      for (let i = 0; i < Math.pow(size, 3); ++i) {
        this.content.push(null); // empty cells
      }

    }

    // get value of voxel at a given 3D position
    get(pos) {

      if (!(pos instanceof Pos3D)) {
        console.log(pos);
        throw new Error(
          "Expected 3D Pos as argument, got " + JSON.stringify(pos)
        );
      }

      const {
        x,
        y,
        z
      } = pos;

      const size = this.size;

      if (x < 0 || y < 0 || z < 0 || x >= size || y >= size || z >= size) {
        throw new Error("Pos out of map bounds");
      }

      return this.content[x * size * size + y * size + z];
    }

    // set value of voxel at a given 3D position
    set(pos, val) {

      if (!(pos instanceof Pos3D)) {
        console.log(pos);
        throw new Error(
          "Expected 3D Pos as argument, got " + JSON.stringify(pos)
        );
      }

      const {
        x,
        y,
        z
      } = pos;

      const size = this.size;

      if (x < 0 || y < 0 || z < 0 || x >= size || y >= size || z >= size) {
        throw new Error("Pos out of map bounds");
      }

      this.content[x * size * size + y * size + z] = val;

    }

    // get values of neighbour voxels 
    // (left, right, forward, upward, downward, above, under, underL, underR) 
    // given an orientation.
    getSucc(pos, rotation) {

      if (!(pos instanceof Pos3D && [1, 3, 5, 7].includes(rotation))) {
        console.log(pos, rotation);
        throw new Error("Bad args for getting succ");
      }

      const {
        x,
        y,
        z
      } = pos;

      const size = this.size;

      if (x < 0 || y < 0 || z < 0 || x >= size || y >= size || z >= size) {
        throw new Error("Pos out of map bounds");
      }
      const max = size - 1;
      let neighbourVoxels;
      const marker = "x"; // for out of bounds voxels

      // return voxel value only if boolExpr is true
      const conditionVoxel = (boolExpr, px, py, pz) => {
        try {
          return boolExpr ? marker : this.get(new Pos3D(px, py, pz));
        } catch (err) {
          return marker;
        }
        // IF expr false return out of bounds marker
      };

      // bounds
      const xMin = x - 1 < 0;
      const xMax = x + 1 > max;
      const yMin = y - 1 < 0;
      const y2Min = y - 2 < 0;
      const yMax = y + 1 > max;
      const y2Max = y + 1 > max;
      const zMin = z - 1 < 0;
      const zMax = z + 1 > max;

      // maths
      switch (rotation) {
        case 1:
          neighbourVoxels = {
            left: conditionVoxel(xMin, x - 1, y, z),
            right: conditionVoxel(xMax, x + 1, y, z),
            forward: conditionVoxel(zMax, x, y, z + 1),
            upward: conditionVoxel(zMax || yMin, x, y - 1, z + 1) && conditionVoxel(y2Min || zMax, x, y - 2, z + 1),
            downward: conditionVoxel(yMax || zMax, x, y + 1, z + 1) && conditionVoxel(y2Max || zMax, x, y + 2, z + 1),
            above: conditionVoxel(yMin, x, y - 1, z) && conditionVoxel(y2Min, x, y - 2, z),
            under: conditionVoxel(yMax, x, y + 1, z) && conditionVoxel(y2Max, x, y + 2, z),
            underL: conditionVoxel(yMax || xMin, x - 1, y + 1, z) && conditionVoxel(y2Max || xMin, x - 1, y + 2, z),
            underR: conditionVoxel(yMax || xMax, x + 1, y + 1, z) && conditionVoxel(y2Max || xMax, x + 1, y + 2, z)
          };
          break;
        case 3:
          neighbourVoxels = {
            left: conditionVoxel(zMax, x, y, z + 1),
            right: conditionVoxel(zMin, x, y, z - 1),
            forward: conditionVoxel(xMax, x + 1, y, z),
            upward: conditionVoxel(xMax || yMin, x + 1, y - 1, z) || conditionVoxel(y2Min || xMax, x + 1, y + 2, z),
            downward: conditionVoxel(xMax || yMax, x + 1, y + 1, z) || conditionVoxel(y2Max || xMax, x + 1, y + 2, z),
            above: conditionVoxel(yMin, x, y - 1, z) || conditionVoxel(y2Min, x, y + 2, z),
            under: conditionVoxel(yMax, x, y + 1, z) || conditionVoxel(y2Max, x, y + 2, z),
            underL: conditionVoxel(yMax || zMax, x, y + 1, z + 1) || conditionVoxel(y2Max || zMax, x, y + 2, z + 1),
            underR: conditionVoxel(yMax || zMin, x, y + 1, z - 1) || conditionVoxel(y2Max || zMin, x, y + 2, z - 1)
          };
          break;
        case 5:
          neighbourVoxels = {
            left: conditionVoxel(xMax, x + 1, y, z),
            right: conditionVoxel(xMin, x - 1, y, z),
            forward: conditionVoxel(zMin, x, y, z - 1),
            upward: conditionVoxel(zMin || yMin, x, y - 1, z - 1) && conditionVoxel(y2Min || zMin, x, y + 2, z - 1),
            downward: conditionVoxel(zMin || yMax, x, y + 1, z - 1) && conditionVoxel(y2Max || zMin, x, y + 2, z - 1),
            above: conditionVoxel(yMin, x, y - 1, z) && conditionVoxel(y2Min, x, y + 2, z),
            under: conditionVoxel(yMax, x, y + 1, z) && conditionVoxel(y2Max, x, y + 2, z),
            underL: conditionVoxel(yMax || xMax, x + 1, y + 1, z) && conditionVoxel(y2Max || xMax, x + 1, y + 2, z),
            underR: conditionVoxel(yMax || xMin, x - 1, y + 1, z) && conditionVoxel(y2Max || xMin, x - 1, y + 2, z)
          };
          break;
        case 7:
          neighbourVoxels = {
            left: conditionVoxel(zMin, x, y, z - 1),
            right: conditionVoxel(zMax, x, y, z + 1),
            forward: conditionVoxel(xMin, x - 1, y, z),
            upward: conditionVoxel(yMin || xMin, x - 1, y - 1, z) && conditionVoxel(y2Min || xMin, x - 1, y + 2, z),
            downward: conditionVoxel(yMax || xMin, x - 1, y + 1, z) && conditionVoxel(y2Max || xMin, x - 1, y + 2, z),
            above: conditionVoxel(yMin, x, y - 1, z) && conditionVoxel(y2Min, x, y + 2, z),
            under: conditionVoxel(yMax, x, y + 1, z) && conditionVoxel(y2Max, x, y + 2, z),
            underL: conditionVoxel(yMax || zMin, x, y + 1, z - 1) && conditionVoxel(y2Max || zMin, x, y + 2, z - 1),
            underR: conditionVoxel(yMax || zMax, x, y + 1, z + 1) && conditionVoxel(y2Max || zMax, x, y + 2, z + 1)
          };
          break;
        default:
          break;
      }

      return neighbourVoxels;
    }
  }

  // Map is just a container for a voxel array, with the added possibility to
  // be extended to a non-cubic size/shape in the future
  class Map {

    constructor(size) {

      if (Math.floor(size) !== size)
        throw new Error("Maps can only have integer sizes");

      if (size < 1)
        throw new Error("Map size must be positive and greater than zero");

      this.size = {
        x: size,
        y: size,
        z: size
      };

      this.voxels = new Arr3D(size);

    }

  }

  // 2D triangle in a 3D space
  class Triangle {

    constructor(p1, p2, p3) {

      if (p1 instanceof Pos3D && p2 instanceof Pos3D && p3 instanceof Pos3D) {

        this.vertices = {
          p1,
          p2,
          p3
        };

      } else {
        console.log(p1, p2, p3);
        throw new Error("Wrong arguments for creating triangle");
      }
    }

  }

  // 2D rectangle in a 3D space
  class Plane {

    constructor(p1, p2, p3, p4) {

      if (
        p1 instanceof Pos3D &&
        p2 instanceof Pos3D &&
        p3 instanceof Pos3D &&
        p4 instanceof Pos3D
      ) {

        this.vertices = {
          p1,
          p2,
          p3,
          p4
        };

      } else {
        throw new Error("Wrong arguments for creating plane");
      }
    }
  }

  // voxel class, stores position (min x,y,z corner of voxel)
  class VoxelPoint {

    // needs a 3D position
    constructor(pos) {

      if (pos instanceof Pos3D) {
        this.pos = pos;
      } else {
        throw new Error("Wrong arguments for creating voxel");
      }

    }

    // get vertices of bottom square
    getVertices() {

      const {
        x,
        y,
        z
      } = this.pos;

      let v1 = new Pos3D(x, y, z);
      let v2 = new Pos3D(x + 1, y, z);
      let v3 = new Pos3D(x + 1, y, z + 1);
      let v4 = new Pos3D(x, y, z + 1);

      return new Plane(v1, v2, v3, v4);

    }
  }

  // absolute direction
  class Direction {

    // orientation ranges from 1 to 8, 
    // orientation 1 = forward (z++), goes clockwise (3 = right)
    // climb is 0, 1 or -1
    constructor(orientation, climb) {

      if (!(isNaN(orientation) && isNaN(climb))) {

        if (
          orientation < 1 ||
          orientation > 8 ||
          orientation != Math.floor(orientation)
        ) {
          throw new Error("Unaccepted orientation argument for direction");
        }

        if (climb !== 0 && climb !== -1 && climb !== 1) {
          throw new Error("Unaccepted climb argument for direction");
        }

        this.orientation = orientation;
        this.climb = climb;

      } else {
        throw new Error("Wrong parameter types for direction");
      }

    }
  }

  // A road piece occupies one voxel, storing a 2D shape and its direction
  class Road {

    constructor(voxel, direction, rotation) {

      if (
        !(
          voxel instanceof VoxelPoint &&
          direction instanceof Direction && [1, 3, 5, 7].includes(rotation)
        )
      ) {
        console.log(voxel, direction, rotation);
        throw new Error("Wrong parameter types for road");
      }

      this.voxel = voxel;
      this.direction = direction;
      this.road = Road.createRoadPlane(voxel, direction, rotation);

    }

    // create shape for road
    static createRoadPlane(voxel, direction, rotation) {

      if (
        !(
          voxel instanceof VoxelPoint &&
          direction instanceof Direction && [1, 3, 5, 7].includes(rotation)
        )
      ) {
        throw new Error("Wrong parameter types for road plane");
      }

      const {
        orientation,
        climb
      } = direction;

      const bottomPlane = voxel.getVertices();

      const {
        p1: v1,
        p2: v2,
        p3: v3,
        p4: v4
      } = bottomPlane.vertices;

      const temp = orientation + rotation;
      const absOrientation = temp > 9 ? temp - 9 : temp - 1;

      // create and return appropiate shape given direction and climb
      switch (absOrientation) {

        case 1:
          if (climb === -1) {
            return new Plane(v1, v2, v3.increase("y"), v4.increase("y"));
          } else if (climb === 0) {
            return new Plane(v1, v2, v3, v4);
          } else {
            return new Plane(v1, v2, v3.decrease("y"), v4.decrease("y"));
          }
          break;

        case 2:
          if (climb === 0) {
            if (rotation === 1)
              return new Triangle(v1, v2, v3);
            if (rotation === 3)
              return new Triangle(v3, v4, v1);
          } else {
            throw new Error("Cannot create non-horizontal diagonal road segment");
          }
          break;

        case 3:
          if (climb === -1) {
            return new Plane(v1, v2.increase("y"), v3.increase("y"), v4);
          } else if (climb === 0) {
            return new Plane(v1, v2, v3, v4);
          } else {
            return new Plane(v1, v2.decrease("y"), v3.decrease("y"), v4);
          }
          break;

        case 4:
          if (climb === 0) {
            if (rotation === 3)
              return new Triangle(v4, v1, v2);
            if (rotation === 5)
              return new Triangle(v3, v4, v2);
          } else {
            throw new Error("Cannot create non-horizontal diagonal road segment");
          }
          break;

        case 5:
          if (climb === -1) {
            return new Plane(v1.increase("y"), v2.increase("y"), v3, v4);
          } else if (climb === 0) {
            return new Plane(v1, v2, v3, v4);
          } else {
            return new Plane(v1.decrease("y"), v2.decrease("y"), v3, v4);
          }
          break;

        case 6:
          if (climb === 0) {
            if (rotation === 5)
              return new Triangle(v1, v3, v4);
            if (rotation === 7)
              return new Triangle(v2, v3, v1);
          } else {
            throw new Error("Cannot create non-horizontal diagonal road segment");
          }
          break;

        case 7:
          if (climb === -1) {
            return new Plane(v1.increase("y"), v2, v3, v4.increase("y"));
          } else if (climb === 0) {
            return new Plane(v1, v2, v3, v4);
          } else {
            return new Plane(v1.decrease("y"), v2, v3, v4.decrease("y"));
          }
          break;

        case 8:
          if (climb === 0) {
            if (rotation === 7)
              return new Triangle(v4, v2, v3);
            if (rotation === 1)
              return new Triangle(v1, v4, v2);
          } else {
            throw new Error("Cannot create non-horizontal diagonal road segment");
          }
          break;

        default:
          console.log(absOrientation, orientation, rotation);
          throw new Error("Invalid orientation for creating road plane");
      }

    }
  }

  // The maximum is exclusive and the minimum is inclusive
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // generate a map with a road of given size (length = no of shapes)
  function generateMap(size) {

    const maxRoadCount = size;
    const map = new Map(size);
    const voxels = map.voxels;
    const middlePos = Math.floor(size / 2);
    const currentVoxelMarker = "self";
    const startPos = new Pos3D(middlePos, middlePos, 0);
    const roads = [];

    let roadCount = 0;
    let currentVoxel = new VoxelPoint(startPos);
    let nextVoxel = null;
    let prevShape = 'square';
    let currentDirection = 1;
    let nextDirection;

    // while the road is not long enough
    while (roadCount < maxRoadCount) {

      // initialize an empty array of available directions
      const availableDirections = [];

      // get current position
      const currPos = currentVoxel.pos;

      // mark current voxel in array
      voxels.set(currPos, currentVoxelMarker);

      // get neighbouring voxels of current voxel, maintaining orientation of the previous road piece
      const neighbourVoxels = voxels.getSucc(currPos, currentDirection);

      // check for conclicts and add to available directions if neigbhour is ok
      const fwd = neighbourVoxels.forward === null;
      const dwd = neighbourVoxels.downward === null;
      const und = neighbourVoxels.under === null;
      const abv = neighbourVoxels.above === null;
      const left = neighbourVoxels.left === null;
      const right = neighbourVoxels.right === null;
      const udL = neighbourVoxels.underL === null;
      const udR = neighbourVoxels.underR === null;
      const upw = neighbourVoxels.upward === null;

      if (left && right && udL && und && prevShape === 'square') // turn left
        availableDirections.push(new Direction(8, 0));
      if (right && left && udR && und && prevShape === 'square') // turn right
        availableDirections.push(new Direction(2, 0));
      if (left && right && upw && fwd && abv) // climb
        availableDirections.push(new Direction(1, 1)); 
      if (left && right && dwd && und && fwd) // go downhill
        availableDirections.push(new Direction(1, -1)); 
      if (left && right && fwd && dwd && und) { // go directly forward (increased chance)
        availableDirections.push(new Direction(1, 0));
        availableDirections.push(new Direction(1, 0));
        availableDirections.push(new Direction(1, 0));
        availableDirections.push(new Direction(1, 0));
      }

      // choose a random direction from avaiable ones (if stuck break generation, 
      // this will be propagated upward and the map will be regenerated from scratch)
      let optionCount = availableDirections.length;
      if (optionCount < 1) {
        break;
      }
      let randOption = availableDirections[getRandomInt(0, optionCount)];

      // generate and store road segment
      let roadSeg = new Road(currentVoxel, randOption, currentDirection);
      voxels.set(currPos, roadSeg);
      roads.push(roadSeg);

      // get straight orientation = non-diagonal (front, left, right, back)
      const {
        climb,
        orientation
      } = randOption;
      let straightOrientation; // from diagonal orientations to ortogonal orientations
      switch (orientation) {
        case 1:
          prevShape = 'square';
          straightOrientation = 1;
          break;
        case 2:
          prevShape = 'triangle';
          straightOrientation = 3;
          break;
        case 8:
          prevShape = 'triangle';
          straightOrientation = 7;
          break;
      }
      currentDirection = currentDirection - 1 + straightOrientation;
      if (currentDirection >= 9) currentDirection -= 8;

      // clone obj as direct assignment would be just copying the reference
      let newPos = cloneObj(currPos);

      // move to next voxel
      switch (currentDirection) {
        case 1:
          newPos.increase("z");
          break;
        case 3:
          newPos.increase("x");
          break;
        case 5:
          newPos.decrease("z");
          break;
        case 7:
          newPos.decrease("x");
          break;
      }
      switch (climb) {
        case 1:
          newPos.decrease("y");
          break;
        case -1:
          newPos.increase("y");
          break;
        default:
          break;
      }
      currentVoxel = new VoxelPoint(newPos);

      roadCount += 1;

    }

    // return an empty road if algorithm got stuck
    if (roads.length < size) return [];

    // otherwise return completely generated road
    return roads;
  }

  // get road pieces out of voxels
  function mapToArray(roads) {
    const getShape = road => road.road;
    return roads.map(getShape);
  }

  // flatten array of positions 
  function simplifyPosArr(posArr) {
    const posToArr = pos => [pos.x, pos.y, pos.z];
    return posArr.map(posToArr);
  }

  // flatten array of shapes
  function simplifyShapeArray(arr) {
    const simplify = shape => {
      const {
        vertices: vs
      } = shape;
      return shape instanceof Triangle ?
        simplifyPosArr([vs.p1, vs.p2, vs.p3]) :
        simplifyPosArr([vs.p1, vs.p2, vs.p3, vs.p4]);
    };
    return arr.map(simplify);
  }

  // generate complete map of given size (repeat generation until not stuck)
  function getMap(size) {
    let map = simplifyShapeArray(mapToArray(generateMap(size)));
    while (map.length === 0) {
      map = simplifyShapeArray(mapToArray(generateMap(size)));
    }
    return map;
  }

  // generate map of given size and convert to JSON
  function generateJSONMap(size) {
    return JSON.stringify(getMap(size));
  }

  return {
    getMap,
    generateJSONMap
  };

})();