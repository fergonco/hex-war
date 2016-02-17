define([], function() {
	
	function getHexPath(center, sideLength) {
		var coords = [];
		coords.push({
			x : center.x - sideLength / 2,
			y : center.y - sideLength
		});
		coords.push({
			x : center.x + sideLength / 2,
			y : center.y - sideLength
		});
		coords.push({
			x : center.x + sideLength,
			y : center.y
		});
		coords.push({
			x : center.x + sideLength / 2,
			y : center.y + sideLength
		});
		coords.push({
			x : center.x - sideLength / 2,
			y : center.y + sideLength
		});
		coords.push({
			x : center.x - sideLength,
			y : center.y
		});

		var path = "M " + coords[0].x + " " + coords[0].y;
		for (var i = 1; i < coords.length; i++) {
			path += "L " + coords[i].x + " " + coords[i].y;
		}

		return path + " Z";
	}
	
	return {
		"getHexPath" : getHexPath
	}
});