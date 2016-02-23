define([ "message-bus" ], function(bus) {

	var cols = null;
	var sideLength = null;

	bus.listen("start-game", function(e, board) {
		cols = board.cols;
	});

	bus.listen("side-length-set", function(e, sLength) {
		sideLength = sLength;
	});

	function getCenter(i) {
		var row = Math.floor(i / cols);
		var col = Math.floor(i % cols);
		var x = col * 1.5 * sideLength + sideLength
		var y = row * 2 * sideLength + sideLength;
		if (col % 2 == 0) {
			y += sideLength;
		}

		return {
			x : x,
			y : y
		};
	}

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
		"getHexPath" : getHexPath,
		"getCenter" : getCenter
	}
});