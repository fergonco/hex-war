describe("game tests", function() {

	var events;
	var listeners;
	var bus;
	var ply;
	var board;
	var boardConf;

	beforeEach(function() {
		ply = {
			CLICKONARMY : 0,
			CLICKONHEX : 1,
			ENDPLY : 2
		};
		boardConf = {
			TERRAIN_TYPE_FLAT : 0,
			TERRAIN_TYPE_MOUNTAIN : 1,
			TERRAIN_TYPE_WATER : 2,
			TERRAIN_TYPE_PORT : 3,
			TERRAIN_TYPE_CITY : 4,
			cols : 5,
			rows : 5,
			cellTypes : [ //
			4, 0, 3, 0, 2, //
			0, 0, 2, 2, 4, //
			0, 0, 2, 2, 0, //
			2, 2, 0, 0, 2, //
			0, 3, 0, 3, 4 ]
		};
		board = {
			putArmy : function() {
			},
			getPlayerCount : function() {
				return 2;
			},
			isAIPlayer : function(index) {
				return index == 0;
			}

		}

		events = [];
		listeners = [];
		bus = {
			"send" : function(eventName, args) {
				events[eventName] = args;
			},
			"listen" : function(eventName, listener) {
				listeners[eventName] = listener;
			}
		};

	});

	function initModule() {
		_initModule("game", [ bus, ply, boardConf ]);
	}
	it("game init", function() {
		spyOn(bus, "send");
		initModule();
		listeners["start-game"](null, board);
		expect(bus.send).toHaveBeenCalledTimes(2);
	});

});