define([ "message-bus", "plyAutomata", "boardConf" ], function(bus, ply, boardConf) {

	var WAITFORCLICK = 0, WAITFORDESTINATION = 1;

	var board = null;

	var currentPlayer;

	var sourcePosition;

	var status;

	bus.listen("start-game", function(e, theBoard) {
		board = theBoard;
		board.putArmy(0, 0, 50);
		board.putArmy(1, 24, 50);
		currentPlayer = -1;
		sourcePosition = null;
		status = WAITFORCLICK;
		nextPly();
	});

	function nextPly() {
		currentPlayer = (currentPlayer + 1) % board.getPlayerCount();
		if (currentPlayer == 0) {
			// TODO update armies
		}
		bus.send("turn", [ currentPlayer ]);
		if (board.isAIPlayer(currentPlayer)) {
			aimove();
			nextPly();
		} else {
			// go out, it will be called in response to user transitions
		}
	}

	bus.listen("transition", function(e, action) {
		console.log("status: " + status);
		switch (status) {
		case WAITFORCLICK:
			switch (action.type) {
			case ply.CLICKONARMY:
				var clickedPlayer = board.owners[action.position];
				if (clickedPlayer == currentPlayer) {
					sourcePosition = action.position;
					status = WAITFORDESTINATION;
				}
				break;
			case ply.ENDPLY:
				nextPly();
				status = AIMOVE;
				break;
			}
			var validTargets = getValidTargets(sourcePosition);
			console.log(validTargets);
			break;
		case WAITFORDESTINATION:
			switch (action.type) {
			case ply.CLICKONHEX:
				var validTargets = getValidTargets(sourcePosition);
				if (validTargets.indexOf(action.position) != -1) {
					bus.send("move-army", [ sourcePosition, action.position ]);
					status = WAITFORCLICK;
				}
				break;
			case ply.ENDPLY:
				nextPly();
				status = AIMOVE;
				break;
			}
			break;
		}
		console.log("status: " + status);
	});

	function pushIfValid(array, sourcePosition, targetPosition) {
		var validMoves = [];
		validMoves[boardConf.TERRAIN_TYPE_FLAT] = [ boardConf.TERRAIN_TYPE_FLAT, boardConf.TERRAIN_TYPE_CITY,
				boardConf.TERRAIN_TYPE_PORT ];
		validMoves[boardConf.TERRAIN_TYPE_CITY] = [ boardConf.TERRAIN_TYPE_FLAT, boardConf.TERRAIN_TYPE_CITY,
				boardConf.TERRAIN_TYPE_PORT ];
		validMoves[boardConf.TERRAIN_TYPE_PORT] = [ boardConf.TERRAIN_TYPE_FLAT, boardConf.TERRAIN_TYPE_CITY,
				boardConf.TERRAIN_TYPE_PORT, boardConf.TERRAIN_TYPE_WATER ];
		validMoves[boardConf.TERRAIN_TYPE_WATER] = [ boardConf.TERRAIN_TYPE_PORT, boardConf.TERRAIN_TYPE_WATER ];
		validMoves[boardConf.TERRAIN_TYPE_MOUNTAIN] = [];
		var targetType = board.types[targetPosition];
		var sourceType = board.types[sourcePosition];
		if (validMoves[sourceType].indexOf(targetType) != -1) {
			array.push(targetPosition);
		}
	}

	function getValidNextAndPrevious(sourcePosition, relativePosition) {
		var ret = [];
		if ((relativePosition + 1) % board.cols != 0) {
			pushIfValid(ret, sourcePosition, relativePosition + 1);
		}
		if (relativePosition % board.cols != 0) {
			pushIfValid(ret, sourcePosition, relativePosition - 1);
		}
		return ret;
	}

	function getValidTargets(position) {
		var ret = getValidNextAndPrevious(position, position);
		var column = position % board.cols;
		if (position - board.cols >= 0) {
			pushIfValid(ret, position, position - board.cols);

			if (column % 2 != 0) {
				ret = ret.concat(getValidNextAndPrevious(position, position - board.cols));
			}
		}
		if (position + board.cols < board.cols * board.rows) {
			pushIfValid(ret, position, position + board.cols);
			if (column % 2 == 0) {
				ret = ret.concat(getValidNextAndPrevious(position, position + board.cols));
			}
		}
		return ret;
	}

	function aimove() {

	}
});