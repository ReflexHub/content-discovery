const ContentFinder = require("../");
const finder = new ContentFinder({
	interval : 1000,
	validity : item => {
		return true
	}
});

finder.search().then(console.log);