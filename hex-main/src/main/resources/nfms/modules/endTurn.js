define([ "message-bus", "d3" ], function(bus) {

	d3.select("body").insert("div", ":first-child").attr("id", "buttonery");

	d3.select("#buttonery").append("div")//
	.attr("class", "button")//
	.html("End ply").on("click", function() {
		bus.send("endply");
	});

});
