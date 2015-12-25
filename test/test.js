const ContentFinder = require("../");
const finder = new ContentFinder({
	interval : 5000,
	watch : true,
	validity : item => {
		return true
	}
});

finder.on("change", (additions, deletions, overall) => {

	console.log(additions.length, deletions.length);

});