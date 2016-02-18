describe("board tests", function() {

	var events;
	var bus;
	var hex;
	var ply;
	var boardConf;

	beforeEach(function() {
		hex = {
			"getHexPath" : function() {
				return ""
			}
		};
		ply = {};
		boardConf = {
			TERRAIN_TYPE_FLAT : 0,
			TERRAIN_TYPE_MOUNTAIN : 1,
			TERRAIN_TYPE_WATER : 2,
			TERRAIN_TYPE_PORT : 3,
			TERRAIN_TYPE_CITY : 4,
			cols : 10,
			rows : 10,
			cellTypes : [ //
			4, 0, 3, 0, 2, 0, 0, 0, 0, 0, //
			0, 0, 2, 2, 4, 2, 2, 0, 0, 0, //
			0, 0, 2, 2, 0, 0, 2, 0, 4, 0, //
			2, 2, 0, 0, 2, 2, 2, 3, 2, 0, //
			0, 3, 0, 3, 2, 2, 2, 2, 0, 0, //
			4, 0, 1, 1, 2, 4, 0, 0, 0, 0, //
			0, 0, 1, 2, 2, 1, 0, 0, 1, 0, //
			0, 0, 1, 2, 3, 1, 0, 1, 0, 0, //
			0, 1, 0, 0, 0, 1, 0, 0, 0, 0, //
			0, 0, 0, 0, 0, 0, 0, 0, 0, 4 ]
		};

		events = [];
		bus = {
			"send" : function(eventName, args) {
				events[eventName] = args;
			},
			"listen" : function() {
			}
		};

	});

	function initModule() {
		_initModule("board", [ bus, boardConf, hex, ply ]);
	}
	it("board init", function() {
		spyOn(bus, "send");
		initModule();
		expect(bus.send).toHaveBeenCalled();
	});

	it("put army", function() {
		initModule();
		var board = events["start-game"][0];
		board.putArmy(0, 3, 25);
		var army = board.getArmy(3);
		expect(army.player).toBe(0);
		expect(army.position).toBe(3);
		expect(army.amount).toBe(25);
	});

	it("put army on existing army", function() {
		initModule();
		var board = events["start-game"][0];
		board.putArmy(0, 3, 25);
		try {
			board.putArmy(0, 3, 25);
			fail();
		} catch (e) {
		}
	});

	it("put army bad player index", function() {
		initModule();
		var board = events["start-game"][0];
		try {
			board.putArmy(2, 3, 25);
			fail();
		} catch (e) {
		}
	});

	it("board size", function() {
		initModule();
		var board = events["start-game"][0];
		expect(board.cols).toBe(10);
	});
});