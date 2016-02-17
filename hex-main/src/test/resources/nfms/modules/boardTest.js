describe("board tests", function() {

	var events;
	var bus;
	var hex;
	var ply;

	beforeEach(function() {
		hex = {
			"getHexPath" : function() {
				return ""
			}
		};
		ply = {};

		events = [];
		bus = {
			"send" : function(eventName, args) {
				events[eventName] = args;
			},
			"listen" : function() {
			}
		};
	});

	it("board init", function() {
		spyOn(bus, "send");
		_initModule("board", [ bus, hex, ply ]);
		expect(bus.send).toHaveBeenCalled();
	});

	it("board size", function() {
		_initModule("board", [ bus, hex, ply ]);
		var board = events["start-game"][0];
		expect(board.cols).toBe(10);
	});
});