function makeLevel(level, type, layers, size, angle, skirt) {
    return {level: level, ptype: type, layers: layers, size: size, angle: angle};
}

const levels = [
    makeLevel(1,'square',3,60,0),
    makeLevel(4,'square',4,60,0),
    makeLevel(7,'square',6,60,0),
    makeLevel(2,'hex',4,40,Math.PI*30/180),
    makeLevel(5,'hex',5,40,Math.PI*30/180),
    makeLevel(8,'hex',6,40,Math.PI*30/180),
    makeLevel(3,'tri',2,75,0),
    makeLevel(6,'tri',3,75,0),
    makeLevel(9,'tri',4,75,0)
]
